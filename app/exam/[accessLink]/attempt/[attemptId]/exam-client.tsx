"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useExamTimer } from "@/hooks/use-exam-timer";
import { useProctoring } from "@/hooks/use-proctoring";
import { Timer } from "./timer";
import { QuestionDisplay } from "./question-display";
import { CameraProctor } from "./camera-proctor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Question = {
  id: string;
  text: string;
  type: "mcq" | "true_false" | "fill_blank" | "essay";
  options: { id: string; text: string }[] | null;
  marks: number;
  imageUrl?: string | null;
};

type Section = {
  id: string;
  title: string;
};

type Progress = {
  current: number;
  total: number;
};

type ExamSection = {
  title: string;
  questionCount: number;
};

type ExamClientProps = {
  attemptId: string;
  accessLink: string;
  examTitle: string;
  candidateName: string;
  initialTimeRemaining: number;
  examDurationMinutes: number;
  totalQuestions: number;
  examSections: ExamSection[];
};

export function ExamClient({
  attemptId,
  accessLink,
  examTitle,
  candidateName,
  initialTimeRemaining,
  examDurationMinutes,
  totalQuestions,
  examSections,
}: ExamClientProps) {
  const router = useRouter();

  // ── Stage ─────────────────────────────────────────────────────────────
  // "instructions" | "permissions" | "exam"
  const [stage, setStage] = useState<"instructions" | "permissions" | "exam">("instructions");

  // ── Proctoring ─────────────────────────────────────────────────────────
  const proctoring = useProctoring(stage === "exam");

  // ── Resume on reload ───────────────────────────────────────────────────
  // If the candidate previously reached the exam stage, skip instructions
  // and permissions on reload by auto-requesting permissions and advancing.
  const isResumeRef = useRef(false);
  const sessionKey = `exam-started:${attemptId}`;

  useEffect(() => {
    if (sessionStorage.getItem(sessionKey)) {
      // Validate the attempt is still in_progress before resuming
      fetch(`/api/v1/exam/attempt/${attemptId}/timer`)
        .then((res) => {
          if (res.ok) {
            isResumeRef.current = true;
            setStage("permissions");
            proctoring.requestPermissions();
          } else {
            // Attempt no longer active — clear stale session
            sessionStorage.removeItem(sessionKey);
            router.push(`/exam/${accessLink}/result/${attemptId}`);
          }
        })
        .catch(() => {
          // Network error — still try to resume
          isResumeRef.current = true;
          setStage("permissions");
          proctoring.requestPermissions();
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When permissions become ready during a resume, auto-advance to exam
  useEffect(() => {
    if (isResumeRef.current && proctoring.isReady && stage === "permissions") {
      setStage("exam");
    }
  }, [proctoring.isReady, stage]);

  const { seconds, formatted, isExpired, reset: resetTimer } = useExamTimer(
    attemptId,
    initialTimeRemaining,
    true,
    proctoring.isPaused
  );

  // Apply body-level copy prevention during exam
  useEffect(() => {
    if (stage !== "exam") return;
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
    return () => {
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
    };
  }, [stage]);

  // Prevent accidental navigation (back button + tab close)
  useEffect(() => {
    if (stage !== "exam") return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }

    // Push a dummy state to trap the back button
    window.history.pushState(null, "", window.location.href);
    function handlePopState() {
      window.history.pushState(null, "", window.location.href);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [stage]);

  // ── Exam state ─────────────────────────────────────────────────────────
  const [question, setQuestion] = useState<Question | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [progress, setProgress] = useState<Progress>({ current: 1, total: 1 });
  const [answeredCount, setAnsweredCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timerReady, setTimerReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [allAnswered, setAllAnswered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const applyQuestionData = useCallback(
    (data: {
      question?: Question;
      section?: Section;
      progress?: Progress;
      timeRemaining?: number;
      allAnswered?: boolean;
    }) => {
      if (data.allAnswered) {
        setAllAnswered(true);
        setQuestion(null);
        setAnsweredCount(data.progress?.total ?? progress.total);
        if (data.progress) setProgress(data.progress);
        return;
      }
      if (data.question) setQuestion(data.question);
      if (data.section) setSection(data.section);
      if (data.progress) {
        setProgress(data.progress);
        setAnsweredCount(data.progress.current - 1);
      }
      setSelectedAnswer(null);
      setAllAnswered(false);
      if (data.timeRemaining !== undefined) {
        resetTimer(data.timeRemaining);
        if (!timerReady) setTimerReady(true);
      }
    },
    [progress.total, resetTimer, timerReady]
  );

  const fetchCurrentQuestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/exam/attempt/${attemptId}/current`);
      if (res.status === 410 || res.status === 403 || res.status === 409) {
        router.push(`/exam/${accessLink}/result/${attemptId}`);
        return;
      }
      if (res.status === 401) {
        router.push(`/exam/${accessLink}/login`);
        return;
      }
      if (!res.ok) {
        setError("Failed to load question. Please try again.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      applyQuestionData(data);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [attemptId, accessLink, router, applyQuestionData]);

  useEffect(() => {
    fetchCurrentQuestion();
  }, [fetchCurrentQuestion]);

  useEffect(() => {
    if (isExpired && !submittingRef.current) {
      submittingRef.current = true;
      handleSubmitExam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpired]);

  // Auto-submit when proctoring violations hit the limit
  useEffect(() => {
    if (proctoring.isAutoSubmitted && !submittingRef.current) {
      submittingRef.current = true;
      handleSubmitExam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proctoring.isAutoSubmitted]);

  // Auto-dismiss violation warning after 3 seconds
  useEffect(() => {
    if (proctoring.latestViolation) {
      const timer = setTimeout(() => proctoring.dismissViolation(), 3000);
      return () => clearTimeout(timer);
    }
  }, [proctoring.latestViolation, proctoring.dismissViolation]);

  async function handleNext() {
    if (!question || !selectedAnswer) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/exam/attempt/${attemptId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, selectedAnswer }),
      });
      if (res.status === 410 || res.status === 409) {
        router.push(`/exam/${accessLink}/result/${attemptId}`);
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit answer.");
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      if (data.next) {
        applyQuestionData(data.next);
      } else {
        await fetchCurrentQuestion();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    if (!question) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/exam/attempt/${attemptId}/skip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id }),
      });
      if (res.status === 410 || res.status === 409) {
        router.push(`/exam/${accessLink}/result/${attemptId}`);
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to skip question.");
        setSubmitting(false);
        return;
      }
      await fetchCurrentQuestion();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitExam(retryCount = 0) {
    sessionStorage.removeItem(sessionKey);
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/exam/attempt/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok || res.status === 403 || res.status === 409) {
        proctoring.cleanup();
        router.push(`/exam/${accessLink}/result/${attemptId}`);
      } else if (retryCount < 3) {
        const delay = Math.min(1000 * 2 ** retryCount, 8000);
        setTimeout(() => handleSubmitExam(retryCount + 1), delay);
      } else {
        setError("Failed to submit exam. Please try again.");
        setSubmitting(false);
        submittingRef.current = false;
      }
    } catch {
      if (retryCount < 3) {
        const delay = Math.min(1000 * 2 ** retryCount, 8000);
        setTimeout(() => handleSubmitExam(retryCount + 1), delay);
      } else {
        setError("Network error. Please try again.");
        setSubmitting(false);
        submittingRef.current = false;
      }
    }
  }

  const progressPercent =
    progress.total > 0 ? Math.round((answeredCount / progress.total) * 100) : 0;

  const bothGranted = proctoring.isReady;
  const anyDenied =
    proctoring.cameraStatus === "denied" ||
    proctoring.micStatus === "denied" ||
    proctoring.cameraStatus === "error" ||
    proctoring.micStatus === "error";

  // ── INSTRUCTIONS PAGE ─────────────────────────────────────────────────
  if (stage === "instructions") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b bg-card">
          <div className="max-w-3xl mx-auto flex items-center gap-3 px-6 h-14">
            <Image src="/GC LOGO.svg" alt="Exam Portal Logo" width={30} height={30} quality={100} className="object-contain" />
            <span className="font-semibold tracking-tight text-sm">Exam Portal</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto py-10 px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Title block */}
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <span className="material-symbols-outlined text-primary text-[26px]">assignment</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{examTitle}</h1>
                <p className="text-sm text-muted-foreground">Welcome, {candidateName} — Read the instructions before you begin</p>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
                <span className="material-symbols-outlined text-primary text-[28px]">timer</span>
                <p className="mt-1.5 text-3xl font-bold text-foreground">{examDurationMinutes}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Minutes</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
                <span className="material-symbols-outlined text-primary text-[28px]">quiz</span>
                <p className="mt-1.5 text-3xl font-bold text-foreground">{totalQuestions}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Questions</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
                <span className="material-symbols-outlined text-primary text-[28px]">view_list</span>
                <p className="mt-1.5 text-3xl font-bold text-foreground">{examSections.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Sections</p>
              </div>
            </div>

            {/* Sections breakdown */}
            {examSections.length > 0 && (
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border bg-muted/40">
                  <h2 className="text-sm font-semibold text-foreground">Sections Breakdown</h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">#</th>
                      <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Section</th>
                      <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">Questions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examSections.map((s, i) => (
                      <tr key={i} className={i < examSections.length - 1 ? "border-b border-border" : ""}>
                        <td className="px-5 py-3 text-muted-foreground text-xs">{i + 1}</td>
                        <td className="px-5 py-3 font-medium text-foreground">{s.title}</td>
                        <td className="px-5 py-3 text-right">
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                            {s.questionCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Exam rules */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-muted/40">
                <h2 className="text-sm font-semibold text-foreground">Exam Rules</h2>
              </div>
              <ul className="divide-y divide-border">
                <li className="flex items-start gap-4 px-5 py-4">
                  <span className="material-symbols-outlined text-primary text-[20px] mt-0.5 shrink-0">timer</span>
                  <span className="text-sm text-muted-foreground">
                    You have <strong className="text-foreground">{examDurationMinutes} minutes</strong> to complete this exam. The timer starts as soon as you begin.
                  </span>
                </li>
                <li className="flex items-start gap-4 px-5 py-4">
                  <span className="material-symbols-outlined text-primary text-[20px] mt-0.5 shrink-0">save</span>
                  <span className="text-sm text-muted-foreground">
                    Each answer is <strong className="text-foreground">saved automatically</strong> when you click Next. You <strong className="text-foreground">cannot go back</strong> to previous questions.
                  </span>
                </li>
                <li className="flex items-start gap-4 px-5 py-4">
                  <span className="material-symbols-outlined text-primary text-[20px] mt-0.5 shrink-0">send</span>
                  <span className="text-sm text-muted-foreground">
                    The exam will be <strong className="text-foreground">auto-submitted</strong> when the timer runs out.
                  </span>
                </li>
                <li className="flex items-start gap-4 px-5 py-4">
                  <span className="material-symbols-outlined text-red-500 text-[20px] mt-0.5 shrink-0">videocam</span>
                  <span className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Camera and microphone are mandatory.</strong> You will be prompted to allow access before the exam begins.
                  </span>
                </li>
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
              </ul>
            </div>

            {/* Proceed button */}
            <button
              onClick={() => setStage("permissions")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors shadow-md shadow-primary/20 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Loading exam...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
                  Proceed to Camera Setup
                </>
              )}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── PERMISSIONS PAGE ──────────────────────────────────────────────────
  if (stage === "permissions") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b bg-card">
          <div className="max-w-3xl mx-auto flex items-center gap-3 px-6 h-14">
            <Image src="/GC LOGO.svg" alt="Exam Portal Logo" width={30} height={30} quality={100} className="object-contain" />
            <span className="font-semibold tracking-tight text-sm">Exam Portal</span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
                <span className="material-symbols-outlined text-primary text-[36px]">security</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Enable Proctoring</h1>
              <p className="text-sm text-muted-foreground">
                Camera and microphone access is <strong className="text-foreground">required</strong> to start the exam.
                Click the button below and allow both permissions when prompted by your browser.
              </p>
            </div>

            {/* Permission status cards */}
            <div className="space-y-3">
              {/* Camera */}
              <div className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
                proctoring.cameraStatus === "granted"
                  ? "border-green-500/40 bg-green-500/5"
                  : proctoring.cameraStatus === "denied" || proctoring.cameraStatus === "error"
                  ? "border-red-500/40 bg-red-500/5"
                  : proctoring.cameraStatus === "requesting"
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card"
              }`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  proctoring.cameraStatus === "granted" ? "bg-green-500/10" :
                  proctoring.cameraStatus === "denied" || proctoring.cameraStatus === "error" ? "bg-red-500/10" :
                  proctoring.cameraStatus === "requesting" ? "bg-primary/10" : "bg-muted"
                }`}>
                  {proctoring.cameraStatus === "requesting" ? (
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className={`material-symbols-outlined text-[22px] ${
                      proctoring.cameraStatus === "granted" ? "text-green-500" :
                      proctoring.cameraStatus === "denied" || proctoring.cameraStatus === "error" ? "text-red-500" :
                      "text-muted-foreground"
                    }`}>
                      {proctoring.cameraStatus === "denied" || proctoring.cameraStatus === "error" ? "videocam_off" : "videocam"}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">Camera</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {proctoring.cameraStatus === "idle" && "Required for video proctoring"}
                    {proctoring.cameraStatus === "requesting" && "Waiting for permission..."}
                    {proctoring.cameraStatus === "granted" && "Camera access granted"}
                    {proctoring.cameraStatus === "denied" && "Camera access denied — please allow in browser settings"}
                    {proctoring.cameraStatus === "error" && "Camera not found or unavailable"}
                  </p>
                </div>
                {proctoring.cameraStatus === "granted" && (
                  <span className="material-symbols-outlined text-green-500 text-[22px] shrink-0">check_circle</span>
                )}
                {(proctoring.cameraStatus === "denied" || proctoring.cameraStatus === "error") && (
                  <span className="material-symbols-outlined text-red-500 text-[22px] shrink-0">cancel</span>
                )}
              </div>

              {/* Microphone */}
              <div className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
                proctoring.micStatus === "granted"
                  ? "border-green-500/40 bg-green-500/5"
                  : proctoring.micStatus === "denied" || proctoring.micStatus === "error"
                  ? "border-red-500/40 bg-red-500/5"
                  : proctoring.micStatus === "requesting"
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card"
              }`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  proctoring.micStatus === "granted" ? "bg-green-500/10" :
                  proctoring.micStatus === "denied" || proctoring.micStatus === "error" ? "bg-red-500/10" :
                  proctoring.micStatus === "requesting" ? "bg-primary/10" : "bg-muted"
                }`}>
                  {proctoring.micStatus === "requesting" ? (
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className={`material-symbols-outlined text-[22px] ${
                      proctoring.micStatus === "granted" ? "text-green-500" :
                      proctoring.micStatus === "denied" || proctoring.micStatus === "error" ? "text-red-500" :
                      "text-muted-foreground"
                    }`}>
                      {proctoring.micStatus === "denied" || proctoring.micStatus === "error" ? "mic_off" : "mic"}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">Microphone</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {proctoring.micStatus === "idle" && "Required for audio proctoring"}
                    {proctoring.micStatus === "requesting" && "Waiting for permission..."}
                    {proctoring.micStatus === "granted" && "Microphone access granted"}
                    {proctoring.micStatus === "denied" && "Microphone access denied — please allow in browser settings"}
                    {proctoring.micStatus === "error" && "Microphone not found or unavailable"}
                  </p>
                </div>
                {proctoring.micStatus === "granted" && (
                  <span className="material-symbols-outlined text-green-500 text-[22px] shrink-0">check_circle</span>
                )}
                {(proctoring.micStatus === "denied" || proctoring.micStatus === "error") && (
                  <span className="material-symbols-outlined text-red-500 text-[22px] shrink-0">cancel</span>
                )}
              </div>
            </div>

            {/* Denial help text */}
            {anyDenied && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
                <span className="material-symbols-outlined text-amber-500 text-[18px] mt-0.5 shrink-0">info</span>
                <p className="text-xs text-muted-foreground">
                  Permission was denied. Click the <strong className="text-foreground">lock icon</strong> in your browser&apos;s address bar → reset camera and microphone permissions → then refresh and try again.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              {!bothGranted && (
                <button
                  onClick={proctoring.requestPermissions}
                  disabled={proctoring.cameraStatus === "requesting"}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors shadow-md shadow-primary/20 text-base disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {proctoring.cameraStatus === "requesting" ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Waiting for permissions...
                    </>
                  ) : anyDenied ? (
                    <>
                      <span className="material-symbols-outlined text-[22px]">refresh</span>
                      Try Again
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[22px]">videocam</span>
                      Enable Camera &amp; Microphone
                    </>
                  )}
                </button>
              )}

              {bothGranted && (
                <button
                  onClick={() => {
                    sessionStorage.setItem(sessionKey, "1");
                    setStage("exam");
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 bg-green-600 hover:bg-green-600/90 text-white font-semibold transition-colors shadow-md text-base"
                >
                  <span className="material-symbols-outlined text-[22px]">play_arrow</span>
                  Start Exam
                </button>
              )}

              <button
                onClick={() => setStage("instructions")}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                ← Back to instructions
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── EXAM UI ───────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col min-h-screen select-none"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <CameraProctor mediaStream={proctoring.mediaStream} />

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
              Re-enable Camera &amp; Microphone
            </button>
          </div>
        </div>
      )}

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

      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border bg-card px-6 py-3 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4 text-foreground">
          <div className="flex items-center justify-center rounded-lg bg-primary/10 overflow-hidden">
            <Image src="/GC LOGO.svg" alt="GC Logo" width={32} height={32} className="object-contain" />
          </div>
          <div className="hidden sm:block">
            <h2 className="text-foreground text-lg font-bold leading-tight tracking-tight">{examTitle}</h2>
            <p className="text-xs text-muted-foreground">{candidateName}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Timer formatted={formatted} seconds={seconds} timerReady={timerReady} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-lg h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Submit Exam</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
                <AlertDialogDescription>
                  You have answered {answeredCount} of {progress.total} questions.
                  {answeredCount < progress.total && (
                    <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">
                      Warning: {progress.total - answeredCount} unanswered questions will be marked as unanswered.
                    </span>
                  )}
                  <span className="block mt-2">This action cannot be undone.</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction onClick={() => handleSubmitExam()} variant="destructive">
                  Submit Exam
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-background p-4 md:p-8 lg:p-12 relative">
          <div className="max-w-3xl mx-auto w-full flex flex-col h-full">
            {/* Progress */}
            <div className="mb-6 flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <span className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
                  {section?.title
                    ? `${section.title} — Question ${progress.current} of ${progress.total}`
                    : `Question ${progress.current} of ${progress.total}`}
                </span>
                <span className="text-primary font-bold text-sm">{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="bg-card rounded-xl shadow-sm border border-border p-6 md:p-10 flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-muted-foreground text-sm">Loading question...</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div role="alert" aria-live="assertive" className="bg-card rounded-xl shadow-sm border border-red-200 dark:border-red-800 p-6 md:p-10 flex-1 flex flex-col items-center justify-center gap-4">
                <span className="material-symbols-outlined text-destructive text-[48px]" aria-hidden="true">error</span>
                <p className="text-destructive font-medium text-center">{error}</p>
                <button onClick={fetchCurrentQuestion} className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors">
                  Retry
                </button>
              </div>
            )}

            {/* All answered */}
            {allAnswered && !loading && !error && (
              <div className="bg-card rounded-xl shadow-sm border border-border p-6 md:p-10 flex-1 flex flex-col items-center justify-center gap-6">
                <span className="material-symbols-outlined text-green-500 text-[64px]">check_circle</span>
                <div className="text-center">
                  <h2 className="text-foreground text-2xl font-bold mb-2">All Questions Answered!</h2>
                  <p className="text-muted-foreground">You have answered all questions. Submit your exam when ready.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      disabled={submitting}
                      className="flex items-center gap-2 px-8 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[20px]">send</span>
                      Submit Exam
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You have answered all {progress.total} questions. Ready to submit?
                        <span className="block mt-2">This action cannot be undone.</span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogAction onClick={() => handleSubmitExam()} variant="destructive">
                        Submit Exam
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {/* Question card */}
            {question && !loading && !error && !allAnswered && (
              <div className="bg-card rounded-xl shadow-sm border border-border p-6 md:p-10 flex-1 flex flex-col">
                <QuestionDisplay
                  question={question}
                  selectedAnswer={selectedAnswer}
                  onSelect={setSelectedAnswer}
                  questionNumber={progress.current}
                />
                {question.imageUrl && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-border relative w-full aspect-video max-h-80">
                    <Image
                      src={question.imageUrl}
                      alt={`Illustration for question ${progress.current}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 768px"
                      className="object-contain"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                  <button
                    onClick={handleSkip}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">skip_next</span>
                    Skip
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!selectedAnswer || submitting}
                    className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Next
                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 text-center text-muted-foreground text-xs">
              Attempt: {attemptId.slice(0, 8)}... &bull; Time remaining: {formatted}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
