"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type DeviceStatus = "idle" | "requesting" | "granted" | "denied" | "error" | "lost";

type Violations = {
  tabSwitch: number;
  total: number;
};

type ProctoringState = {
  cameraStatus: DeviceStatus;
  micStatus: DeviceStatus;
  mediaStream: MediaStream | null;
  isPaused: boolean;
  violations: Violations;
  isAutoSubmitted: boolean;
  isReady: boolean;
  latestViolation: string | null;
  requestPermissions: () => Promise<void>;
  retryPermissions: () => Promise<void>;
  dismissViolation: () => void;
  cleanup: () => void;
};

const MAX_VIOLATIONS = 3;

export function useProctoring(examStarted: boolean): ProctoringState {
  const [cameraStatus, setCameraStatus] = useState<DeviceStatus>("idle");
  const [micStatus, setMicStatus] = useState<DeviceStatus>("idle");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [violations, setViolations] = useState<Violations>({ tabSwitch: 0, total: 0 });
  const [isAutoSubmitted, setIsAutoSubmitted] = useState(false);
  const [latestViolation, setLatestViolation] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const examStartedRef = useRef(examStarted);
  const violationsRef = useRef(violations);
  const isAutoSubmittedRef = useRef(false);
  const isPausedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { examStartedRef.current = examStarted; }, [examStarted]);
  useEffect(() => { violationsRef.current = violations; }, [violations]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  const isReady = cameraStatus === "granted" && micStatus === "granted";

  // ── Request permissions ──────────────────────────────────────────────
  const requestPermissions = useCallback(async () => {
    setCameraStatus("requesting");
    setMicStatus("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });

      const hasVideo = stream.getVideoTracks().length > 0;
      const hasAudio = stream.getAudioTracks().length > 0;

      setCameraStatus(hasVideo ? "granted" : "denied");
      setMicStatus(hasAudio ? "granted" : "denied");

      if (hasVideo && hasAudio) {
        streamRef.current = stream;
        setMediaStream(stream);
        setIsPaused(false);

        // Monitor track health for mid-exam permission loss
        stream.getTracks().forEach((track) => {
          track.onended = () => {
            if (examStartedRef.current) {
              const isVideo = track.kind === "video";
              if (isVideo) setCameraStatus("lost");
              else setMicStatus("lost");
              setIsPaused(true);
            }
          };
          track.onmute = () => {
            if (examStartedRef.current) {
              const isVideo = track.kind === "video";
              if (isVideo) setCameraStatus("lost");
              else setMicStatus("lost");
              setIsPaused(true);
            }
          };
        });
      } else {
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
        setCameraStatus("denied");
        setMicStatus("denied");
      } else if (error?.name === "NotFoundError") {
        setCameraStatus("error");
        setMicStatus("error");
      } else {
        setCameraStatus("error");
        setMicStatus("error");
      }
    }
  }, []);

  // ── Retry after permission loss (re-requests getUserMedia) ──────────
  const retryPermissions = useCallback(async () => {
    // Stop old tracks first
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setMediaStream(null);
    await requestPermissions();
  }, [requestPermissions]);

  // ── Tab-switch / visibility detection ────────────────────────────────
  useEffect(() => {
    if (!examStarted) return;

    // Grace period: ignore blur/visibility events for the first 2 seconds
    // after the exam starts. This prevents false positives from the browser
    // permission dialog closing, dev tools being open, or stage transition.
    let armed = false;
    const graceTimer = setTimeout(() => { armed = true; }, 2000);

    // Debounce: prevent blur + visibilitychange from double-counting the
    // same tab switch. Without this, one tab switch fires both events and
    // counts as 2 violations (auto-submitting after only 2 actual switches).
    let lastViolationTime = 0;

    function addViolation() {
      const now = Date.now();
      if (now - lastViolationTime < 1000) return; // ignore if <1s since last
      lastViolationTime = now;

      setViolations((prev) => {
        const next = { tabSwitch: prev.tabSwitch + 1, total: prev.total + 1 };
        if (next.total >= MAX_VIOLATIONS) {
          isAutoSubmittedRef.current = true;
          setIsAutoSubmitted(true);
        }
        return next;
      });
      setLatestViolation("You switched away from the exam. This has been recorded.");
    }

    function handleVisibilityChange() {
      if (document.hidden && armed && !isAutoSubmittedRef.current) {
        addViolation();
      }
    }

    function handleBlur() {
      // Only fire if document isn't already hidden (avoids double-counting)
      // Skip if already paused — user may be clicking Re-enable which causes blur
      if (!document.hidden && armed && !isAutoSubmittedRef.current && !isPausedRef.current) {
        addViolation();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (!armed || isAutoSubmittedRef.current) return;

      if (e.key === "F12") {
        e.preventDefault();
        addViolation();
        setLatestViolation("Developer tools shortcut detected. This has been recorded.");
        return;
      }

      if (e.ctrlKey && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key)) {
        e.preventDefault();
        addViolation();
        setLatestViolation("Developer tools shortcut detected. This has been recorded.");
        return;
      }

      if (e.ctrlKey && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        addViolation();
        setLatestViolation("View source shortcut detected. This has been recorded.");
        return;
      }
    }

    function handleContextMenu(e: Event) {
      if (armed) e.preventDefault();
    }

    function handleCopyPaste(e: Event) {
      if (armed) e.preventDefault();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);

    return () => {
      clearTimeout(graceTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
    };
  }, [examStarted]);

  // ── Multi-tab detection ──────────────────────────────────────────────
  useEffect(() => {
    if (!examStarted) return;

    const channel = new BroadcastChannel("exam-proctoring");

    channel.postMessage({ type: "tab-open" });

    channel.onmessage = (event) => {
      if (event.data?.type === "tab-open" && !isAutoSubmittedRef.current) {
        setViolations((prev) => {
          const next = { tabSwitch: prev.tabSwitch, total: prev.total + 1 };
          if (next.total >= MAX_VIOLATIONS) {
            isAutoSubmittedRef.current = true;
            setIsAutoSubmitted(true);
          }
          return next;
        });
        setLatestViolation("Multiple exam tabs detected. This has been recorded.");
      }
    };

    return () => {
      channel.close();
    };
  }, [examStarted]);

  // ── Dismiss violation toast ──────────────────────────────────────────
  const dismissViolation = useCallback(() => {
    setLatestViolation(null);
  }, []);

  // ── Cleanup ──────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setMediaStream(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return {
    cameraStatus,
    micStatus,
    mediaStream,
    isPaused,
    violations,
    isAutoSubmitted,
    isReady,
    latestViolation,
    requestPermissions,
    retryPermissions,
    dismissViolation,
    cleanup,
  };
}
