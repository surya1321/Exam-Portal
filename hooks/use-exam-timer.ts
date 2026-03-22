"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useExamTimer(
  attemptId: string,
  initialSeconds: number,
  startPaused = false,
  externalPaused = false
) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [paused, setPaused] = useState(startPaused);
  const pausedRef = useRef(startPaused);
  const lastTickRef = useRef(Date.now());
  const effectivePaused = paused || externalPaused;

  // Keep ref in sync so interval callback always has the latest value
  useEffect(() => {
    pausedRef.current = effectivePaused;
  }, [effectivePaused]);

  // Countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (pausedRef.current) return;
      lastTickRef.current = Date.now();
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []); // Run once — functional updater captures no external state

  // Detect wake from sleep/hibernate and sync immediately
  useEffect(() => {
    async function handleVisibilityChange() {
      if (document.hidden || pausedRef.current) return;
      const elapsed = Date.now() - lastTickRef.current;
      if (elapsed > 3000) {
        try {
          const res = await fetch(`/api/v1/exam/attempt/${attemptId}/timer`);
          if (res.ok) {
            const data = await res.json();
            setSeconds(data.timeRemaining);
          }
        } catch {
          setSeconds((prev) => Math.max(0, prev - Math.floor(elapsed / 1000)));
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [attemptId]);

  // Sync with server every 30 seconds (skip while paused — server clock
  // keeps ticking but we don't want it to override the paused client timer)
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (pausedRef.current) return;
      try {
        const res = await fetch(`/api/v1/exam/attempt/${attemptId}/timer`);
        if (res.ok) {
          const data = await res.json();
          setSeconds(data.timeRemaining);
        }
      } catch {
        // Silently fail — local timer continues
      }
    }, 30000);
    return () => clearInterval(syncInterval);
  }, [attemptId]);

  // Reset timer to a new value and unpause
  const reset = useCallback((newSeconds: number) => {
    setSeconds(newSeconds);
    setPaused(false);
  }, []);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const formatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return { seconds, formatted, isExpired: seconds <= 0, reset, paused: effectivePaused };
}
