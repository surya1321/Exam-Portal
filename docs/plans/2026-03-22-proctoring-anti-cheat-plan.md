# Proctoring & Anti-Cheat Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add camera/mic proctoring (deterrent only — no recording), copy prevention, tab-switch detection with 3-strike auto-submit, and timer pause on permission loss.

**Architecture:** Single `useProctoring` hook owns all proctoring state (media streams, permission monitoring, tab-switch violations, pause signal). ExamClient consumes it and renders overlays. Timer hook accepts an external `isPaused` flag. CameraProctor receives the stream as a prop instead of requesting its own.

**Tech Stack:** React 19, Next.js 16 App Router, TypeScript, Tailwind CSS v4, MediaDevices API (`getUserMedia`)

---

### Task 1: Create `useProctoring` Hook

**Files:**
- Create: `hooks/use-proctoring.ts`

**Step 1: Create the hook file with full implementation**

```typescript
// hooks/use-proctoring.ts
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

  // Keep refs in sync
  useEffect(() => { examStartedRef.current = examStarted; }, [examStarted]);
  useEffect(() => { violationsRef.current = violations; }, [violations]);

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

    function handleVisibilityChange() {
      if (document.hidden && !isAutoSubmittedRef.current) {
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
    }

    function handleBlur() {
      // Only fire if document isn't already hidden (avoids double-counting)
      if (!document.hidden && !isAutoSubmittedRef.current) {
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
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
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
```

**Step 2: Verify file compiles**

Run: `npx tsc --noEmit hooks/use-proctoring.ts` (or rely on IDE — just ensure no red squiggles)

**Step 3: Commit**

```bash
git add hooks/use-proctoring.ts
git commit -m "feat: add useProctoring hook for camera/mic/tab-switch monitoring"
```

---

### Task 2: Update `useExamTimer` to Support External Pause

**Files:**
- Modify: `hooks/use-exam-timer.ts`

**Step 1: Add `isProctoringPaused` parameter**

The hook already has an internal `paused` state and `pausedRef`. We need to also pause when proctoring signals a pause. Replace the hook to accept an external pause signal:

Change the function signature from:
```typescript
export function useExamTimer(
  attemptId: string,
  initialSeconds: number,
  startPaused = false
)
```

To:
```typescript
export function useExamTimer(
  attemptId: string,
  initialSeconds: number,
  startPaused = false,
  externalPaused = false
)
```

Add a computed `effectivePaused` that combines both:
```typescript
const effectivePaused = paused || externalPaused;
```

Update the `pausedRef` sync effect from:
```typescript
useEffect(() => {
  pausedRef.current = paused;
}, [paused]);
```

To:
```typescript
useEffect(() => {
  pausedRef.current = effectivePaused;
}, [effectivePaused]);
```

Update the return to include `effectivePaused`:
```typescript
return { seconds, formatted, isExpired: seconds <= 0, reset, paused: effectivePaused };
```

No other changes — the interval callback already reads `pausedRef.current` so it will respect the external pause automatically. Server sync also already silently continues but the timer won't decrement.

**Step 2: Verify the hook still works**

Run: `npx tsc --noEmit hooks/use-exam-timer.ts`

**Step 3: Commit**

```bash
git add hooks/use-exam-timer.ts
git commit -m "feat: add externalPaused parameter to useExamTimer for proctoring pause"
```

---

### Task 3: Rewrite `CameraProctor` to Accept Stream as Prop

**Files:**
- Modify: `app/exam/[accessLink]/attempt/[attemptId]/camera-proctor.tsx`

**Step 1: Replace entire component**

The current component requests its own `getUserMedia` stream. Replace it to accept a `mediaStream` prop and show an enhanced UI with pulsing dot and "Exam is being monitored" text.

```typescript
"use client";

import { useEffect, useRef, useState } from "react";

type CameraProctorProps = {
  mediaStream: MediaStream | null;
};

export function CameraProctor({ mediaStream }: CameraProctorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoActive, setVideoActive] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    if (mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(() => {});
      setVideoActive(true);
    } else {
      videoRef.current.srcObject = null;
      setVideoActive(false);
    }
  }, [mediaStream]);

  return (
    <div className="fixed bottom-4 right-4 z-40 overflow-hidden rounded-xl border border-border shadow-2xl">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 bg-black/90 px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-[pulse_2s_ease-in-out_infinite]" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Live</span>
        </div>
        <span className="text-[10px] text-zinc-400">Proctored</span>
      </div>

      {/* Video feed */}
      <div className="relative bg-black">
        {!videoActive && (
          <div className="h-28 w-40 flex flex-col items-center justify-center bg-zinc-900 gap-2">
            <span className="material-symbols-outlined text-zinc-500 text-[28px]">videocam_off</span>
            <span className="text-[10px] text-zinc-500">Camera disconnected</span>
          </div>
        )}
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className={`h-28 w-40 object-cover [transform:scaleX(-1)] ${!videoActive ? "hidden" : ""}`}
          aria-label="Camera proctoring feed"
        />
      </div>

      {/* Footer - monitoring text */}
      <div className="flex items-center justify-center gap-1.5 bg-black/90 px-3 py-1">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-[pulse_2s_ease-in-out_infinite]" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
        </span>
        <span className="text-[9px] text-zinc-400 tracking-wide">Exam is being monitored</span>
      </div>
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit app/exam/[accessLink]/attempt/[attemptId]/camera-proctor.tsx`

**Step 3: Commit**

```bash
git add app/exam/[accessLink]/attempt/[attemptId]/camera-proctor.tsx
git commit -m "feat: CameraProctor accepts stream prop, enhanced monitoring UI"
```

---

### Task 4: Integrate `useProctoring` into ExamClient — Replace Permission Logic

**Files:**
- Modify: `app/exam/[accessLink]/attempt/[attemptId]/exam-client.tsx`

**Step 1: Replace imports and permission state**

At the top of the file, add the import:
```typescript
import { useProctoring } from "@/hooks/use-proctoring";
```

Inside the `ExamClient` component, replace these lines:

```typescript
// ── Permission state ───────────────────────────────────────────────────
const [cameraStatus, setCameraStatus] = useState<PermissionStatus>("idle");
const [micStatus, setMicStatus] = useState<PermissionStatus>("idle");
const permStreamRef = useRef<MediaStream | null>(null);
```

With:
```typescript
// ── Proctoring ─────────────────────────────────────────────────────────
const proctoring = useProctoring(stage === "exam");
```

**Step 2: Update timer hook call to pass proctoring pause**

Change:
```typescript
const { seconds, formatted, isExpired, reset: resetTimer } = useExamTimer(
  attemptId,
  initialTimeRemaining,
  true
);
```

To:
```typescript
const { seconds, formatted, isExpired, reset: resetTimer } = useExamTimer(
  attemptId,
  initialTimeRemaining,
  true,
  proctoring.isPaused
);
```

**Step 3: Remove the `requestPermissions` function**

Delete the entire `async function requestPermissions()` block (lines 217-263 in the current file). The `useProctoring` hook now handles this.

**Step 4: Remove the `PermissionStatus` type**

Delete this line since the hook owns the type:
```typescript
type PermissionStatus = "idle" | "requesting" | "granted" | "denied" | "error";
```

**Step 5: Update derived state**

Replace:
```typescript
const bothGranted = cameraStatus === "granted" && micStatus === "granted";
const anyDenied =
  cameraStatus === "denied" ||
  micStatus === "denied" ||
  cameraStatus === "error" ||
  micStatus === "error";
```

With:
```typescript
const bothGranted = proctoring.isReady;
const anyDenied =
  proctoring.cameraStatus === "denied" ||
  proctoring.micStatus === "denied" ||
  proctoring.cameraStatus === "error" ||
  proctoring.micStatus === "error";
```

**Step 6: Update permissions page to use hook**

In the permissions page JSX, replace all references:
- `cameraStatus` → `proctoring.cameraStatus`
- `micStatus` → `proctoring.micStatus`
- `requestPermissions` → `proctoring.requestPermissions`

**Step 7: Commit**

```bash
git add app/exam/[accessLink]/attempt/[attemptId]/exam-client.tsx
git commit -m "refactor: replace manual permission logic with useProctoring hook"
```

---

### Task 5: Add Anti-Cheat Overlays and Copy Prevention to Exam Stage

**Files:**
- Modify: `app/exam/[accessLink]/attempt/[attemptId]/exam-client.tsx`

**Step 1: Add auto-submit effect for violation limit**

Add this effect after the existing `isExpired` effect:
```typescript
// Auto-submit when proctoring violations hit the limit
useEffect(() => {
  if (proctoring.isAutoSubmitted && !submittingRef.current) {
    submittingRef.current = true;
    handleSubmitExam();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [proctoring.isAutoSubmitted]);
```

**Step 2: Add auto-dismiss for violation warning**

Add this effect:
```typescript
// Auto-dismiss violation warning after 3 seconds
useEffect(() => {
  if (proctoring.latestViolation) {
    const timer = setTimeout(() => proctoring.dismissViolation(), 3000);
    return () => clearTimeout(timer);
  }
}, [proctoring.latestViolation, proctoring.dismissViolation]);
```

**Step 3: Wrap the exam UI with anti-cheat handlers**

In the exam stage return (the final `return` block), wrap the entire `<>...</>` fragment with an anti-cheat container div:

Replace:
```tsx
return (
  <>
    <CameraProctor />
```

With:
```tsx
return (
  <div
    className="flex flex-col min-h-screen select-none"
    onCopy={(e) => e.preventDefault()}
    onCut={(e) => e.preventDefault()}
    onPaste={(e) => e.preventDefault()}
    onContextMenu={(e) => e.preventDefault()}
  >
    <CameraProctor mediaStream={proctoring.mediaStream} />
```

And replace the closing `</>` with `</div>`.

**Step 4: Add the pause overlay (after CameraProctor, before header)**

```tsx
{/* Proctoring pause overlay */}
{proctoring.isPaused && stage === "exam" && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
    <div className="max-w-md w-full mx-4 bg-card rounded-2xl border border-border p-8 text-center space-y-6 shadow-2xl">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 mx-auto">
        <span className="material-symbols-outlined text-red-500 text-[36px]">videocam_off</span>
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Exam Paused</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Your camera or microphone has been disconnected. The timer is paused.
          Please re-enable both to continue your exam.
        </p>
      </div>
      <button
        onClick={proctoring.retryPermissions}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">videocam</span>
        Re-enable Camera & Microphone
      </button>
    </div>
  </div>
)}
```

**Step 5: Add the tab-switch violation warning (after pause overlay)**

```tsx
{/* Tab-switch violation warning */}
{proctoring.latestViolation && !proctoring.isPaused && stage === "exam" && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="max-w-sm w-full mx-4 bg-card rounded-2xl border border-amber-500/30 p-8 text-center space-y-4 shadow-2xl">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 mx-auto">
        <span className="material-symbols-outlined text-amber-500 text-[32px]">warning</span>
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">
          Warning {proctoring.violations.total} of 3
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          {proctoring.latestViolation}
        </p>
        {proctoring.violations.total >= 2 && (
          <p className="text-xs text-red-500 font-medium mt-2">
            Next violation will auto-submit your exam.
          </p>
        )}
      </div>
      <button
        onClick={proctoring.dismissViolation}
        className="w-full rounded-xl py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors text-sm"
      >
        I Understand
      </button>
    </div>
  </div>
)}
```

**Step 6: Commit**

```bash
git add app/exam/[accessLink]/attempt/[attemptId]/exam-client.tsx
git commit -m "feat: add anti-cheat overlays, copy prevention, tab-switch detection"
```

---

### Task 5b: Add Proctoring Rules to Instructions Page

**Files:**
- Modify: `app/exam/[accessLink]/attempt/[attemptId]/exam-client.tsx`

**Step 1: Add new rule items to the exam rules list**

In the instructions page, inside the `<ul className="divide-y divide-border">`, add these two new `<li>` items after the existing camera/mic rule:

```tsx
<li className="flex items-start gap-4 px-5 py-4">
  <span className="material-symbols-outlined text-red-500 text-[20px] mt-0.5 shrink-0">content_copy</span>
  <span className="text-sm text-muted-foreground">
    <strong className="text-foreground">Copying, pasting, and right-clicking are disabled</strong> during the exam.
  </span>
</li>
<li className="flex items-start gap-4 px-5 py-4">
  <span className="material-symbols-outlined text-red-500 text-[20px] mt-0.5 shrink-0">tab</span>
  <span className="text-sm text-muted-foreground">
    <strong className="text-foreground">Switching tabs or windows is monitored.</strong> After 3 violations, your exam will be auto-submitted.
  </span>
</li>
```

**Step 2: Commit**

```bash
git add app/exam/[accessLink]/attempt/[attemptId]/exam-client.tsx
git commit -m "feat: add anti-cheat rules to exam instructions page"
```

---

### Task 6: Cleanup and Final Verification

**Files:**
- Verify: all modified files

**Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Run the dev server and test manually**

Run: `npm run dev` (or `pnpm dev`)

Manual test checklist:
1. Navigate to an exam access link → see instructions page with new rules about copy prevention and tab monitoring
2. Click "Proceed to Camera Setup" → permissions page appears
3. Click "Enable Camera & Microphone" → browser prompts for permissions
4. Grant both → "Start Exam" button appears and is enabled
5. Click "Start Exam" → exam UI loads with enhanced camera preview (pulsing red dot, "Exam is being monitored")
6. Try right-clicking → blocked (no context menu)
7. Try selecting text → blocked (`user-select: none`)
8. Switch to another tab and back → warning overlay: "Warning 1 of 3"
9. Warning auto-dismisses after 3 seconds (or click "I Understand")
10. Repeat tab switch 2 more times → exam auto-submits after 3rd violation
11. (Separate test) Revoke camera permission mid-exam → pause overlay appears, timer stops
12. Click "Re-enable Camera & Microphone" → re-request flow, exam resumes

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete proctoring & anti-cheat implementation"
```

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `hooks/use-proctoring.ts` | CREATE | Single hook for all proctoring logic |
| `hooks/use-exam-timer.ts` | MODIFY | Add `externalPaused` parameter |
| `app/exam/[accessLink]/attempt/[attemptId]/camera-proctor.tsx` | MODIFY | Accept stream prop, enhanced monitoring UI |
| `app/exam/[accessLink]/attempt/[attemptId]/exam-client.tsx` | MODIFY | Integrate hook, overlays, copy prevention, new rules |
