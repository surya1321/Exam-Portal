# Proctoring & Anti-Cheat Feature Design

**Date:** 2026-03-22
**Status:** Approved

## Goal

Add camera and microphone proctoring to deter cheating during exams. No footage is recorded or stored — the camera/mic feed exists purely as a psychological deterrent. Additionally, prevent text copying and detect tab switches with a strict 3-violation auto-submit policy.

## Requirements

1. Browser prompts candidate to enable camera and microphone after login
2. Exam only starts when both permissions are granted
3. No footage saved to DB — local video preview only (deterrent)
4. Disable text copying, cutting, pasting, and right-click during exam
5. Detect tab switches / window blur — warn candidate and count violations
6. After 3 tab-switch violations, auto-submit the exam
7. If camera/mic permissions are revoked mid-exam, pause exam and timer until re-enabled
8. Enhanced camera preview with pulsing red dot and "Exam is being monitored" text

## Approach

**Single `useProctoring` hook** — consolidates all proctoring logic (camera/mic streams, permission monitoring, tab-switch detection, copy/right-click blocking, violation counting, timer pause signal) into one custom hook.

Chosen over multiple specialized hooks (coordination overhead) and context provider (over-engineered for 2 consumers).

## Design

### 1. `useProctoring` Hook (`hooks/use-proctoring.ts`)

**State:**
- `cameraStatus` / `micStatus`: `"idle" | "requesting" | "granted" | "denied" | "lost"`
- `mediaStream`: active `MediaStream | null`
- `isPaused`: true when permission lost mid-exam
- `violations`: `{ tabSwitch: number, total: number }`
- `isAutoSubmitted`: true when `violations.total >= 3`
- `isReady`: true when both camera AND mic are granted

**Behavior:**
- Calls `getUserMedia({ video: { facingMode: "user" }, audio: true })` on mount
- Monitors `track.onended` and `track.onmute` for mid-exam permission loss → `isPaused = true`
- Listens to `document.visibilitychange` and `window.blur` for tab switches → increments violations
- At 3 total violations → `isAutoSubmitted = true`
- Stops all tracks on unmount

### 2. Timer Pause Integration (`hooks/use-exam-timer.ts`)

- Accepts new `isPaused: boolean` parameter
- When paused: stops countdown interval and skips server sync
- When resumed: restarts interval and does one sync call to reconcile
- No database schema changes — pause is client-side only

### 3. ExamClient Changes (`exam-client.tsx`)

**Stage 2 (Permissions):**
- Uses `useProctoring` hook instead of manual `getUserMedia`
- "Start Exam" enabled only when `isReady === true`

**Stage 3 (Exam) — New overlays:**
- **Pause overlay:** Full-screen overlay when `isPaused` — "Camera/Microphone disconnected. Please re-enable to continue." with re-enable button
- **Tab switch warning:** Modal on violation — "Warning X of 3: You switched away from the exam." Auto-dismisses after 3 seconds
- **Auto-submit:** When `isAutoSubmitted` triggers, calls existing submit and redirects

**Copy/paste/right-click prevention (Stage 3 only):**
- `onCopy`, `onCut`, `onPaste` → `e.preventDefault()` on exam container
- `onContextMenu` → `e.preventDefault()`
- `user-select: none` CSS on exam content

### 4. Enhanced Camera Proctor (`camera-proctor.tsx`)

- Receives `mediaStream` as prop (no duplicate `getUserMedia`)
- Pulsing red dot animation (CSS keyframes)
- "Exam is being monitored" text
- "LIVE" badge with recording indicator
- Shows "Camera disconnected" placeholder when stream is null

## Non-Goals

- No actual video recording or transmission to server
- No face detection or liveness checks
- No keyboard shortcut blocking (Ctrl+C etc.) — CSS `user-select: none` + event prevention is sufficient
- No admin-configurable violation limit (hardcoded to 3)
- No server-side timer pause (client-side only)

## Files to Modify

- `hooks/use-proctoring.ts` — NEW
- `hooks/use-exam-timer.ts` — Add `isPaused` parameter
- `app/exam/[accessLink]/attempt/[attemptId]/exam-client.tsx` — Integrate hook, add overlays, add anti-cheat events
- `app/exam/[accessLink]/attempt/[attemptId]/camera-proctor.tsx` — Accept stream prop, enhanced UI
