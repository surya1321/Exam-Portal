"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useExamTimer } from "@/hooks/use-exam-timer";
import { Timer } from "./timer";
import { QuestionDisplay } from "./question-display";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
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

type ExamClientProps = {
  attemptId: string;
  accessLink: string;
  examTitle: string;
  candidateName: string;
  initialTimeRemaining: number;
  examDurationMinutes: number;
  totalQuestions: number;
};

export function ExamClient({
  attemptId,
  accessLink,
  examTitle,
  candidateName,
  initialTimeRemaining,
  examDurationMinutes,
  totalQuestions,
}: ExamClientProps) {
  const router = useRouter();
  const { seconds, formatted, isExpired, reset: resetTimer } = useExamTimer(
    attemptId,
    initialTimeRemaining,
    true // start paused
  );

  const [question, setQuestion] = useState<Question | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [progress, setProgress] = useState<Progress>({ current: 1, total: 1 });
  const [answeredCount, setAnsweredCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timerReady, setTimerReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [allAnswered, setAllAnswered] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  /** Apply inline question data from any API response */
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

      // Sync timer with server time
      if (data.timeRemaining !== undefined) {
        resetTimer(data.timeRemaining);
        if (!timerReady) setTimerReady(true);
      }
    },
    [progress.total, resetTimer, timerReady]
  );

  // Fetch current question
  const fetchCurrentQuestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/exam/attempt/${attemptId}/current`);
      if (res.status === 410) {
        router.push(`/exam/${accessLink}/result/${attemptId}`);
        return;
      }
      if (res.status === 403) {
        router.push(`/exam/${accessLink}/result/${attemptId}`);
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

  // Load first question on mount
  useEffect(() => {
    fetchCurrentQuestion();
  }, [fetchCurrentQuestion]);

  // Auto-submit on timer expiry — use ref to prevent stale closure double-submit
  useEffect(() => {
    if (isExpired && !submittingRef.current) {
      submittingRef.current = true;
      handleSubmitExam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpired]);

  // Submit answer and go to next question
  async function handleNext() {
    if (!question || !selectedAnswer) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/exam/attempt/${attemptId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          selectedAnswer,
        }),
      });

      if (res.status === 410) {
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

      // Use inline next question data from answer API (avoids second fetch)
      if (data.next) {
        applyQuestionData(data.next);
      } else {
        // Fallback to fetching if API doesn't return inline data
        await fetchCurrentQuestion();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Submit entire exam
  async function handleSubmitExam() {
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/exam/attempt/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok || res.status === 403) {
        router.push(`/exam/${accessLink}/result/${attemptId}`);
      } else {
        setError("Failed to submit exam. Please try again.");
        setSubmitting(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const progressPercent =
    progress.total > 0
      ? Math.round((answeredCount / progress.total) * 100)
      : 0;

  return (
    <>
      {/* Instructions Modal */}
      {showInstructions && !loading && question && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <span className="material-symbols-outlined text-primary text-[48px]">info</span>
              <h2 className="text-xl font-bold text-foreground">Exam Instructions</h2>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px] mt-0.5 shrink-0">timer</span>
                <span>You have <strong className="text-foreground">{examDurationMinutes} minutes</strong> to complete this exam. The timer will start when you begin.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px] mt-0.5 shrink-0">quiz</span>
                <span>There are <strong className="text-foreground">{totalQuestions} questions</strong> in total. Each question is saved automatically when you click Next.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px] mt-0.5 shrink-0">block</span>
                <span>You <strong className="text-foreground">cannot go back</strong> to previous questions once you move forward.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px] mt-0.5 shrink-0">send</span>
                <span>The exam will be <strong className="text-foreground">auto-submitted</strong> when the timer runs out.</span>
              </li>
            </ul>
            <button
              onClick={() => setShowInstructions(false)}
              className="w-full flex items-center justify-center gap-2 rounded-lg h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors shadow-md shadow-primary/20"
            >
              Start Exam
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border bg-card px-6 py-3 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4 text-foreground">
          <div className="flex items-center justify-center rounded-lg bg-primary/10 overflow-hidden">
            <Image
              src="/GC LOGO.svg"
              alt="GC Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div className="hidden sm:block">
            <h2 className="text-foreground text-lg font-bold leading-tight tracking-tight">
              {examTitle}
            </h2>
            <p className="text-xs text-muted-foreground">
              {candidateName}
            </p>
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
                  Are you sure you want to submit your exam? You have answered{" "}
                  {answeredCount} of {progress.total} questions.
                  {answeredCount < progress.total && (
                    <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">
                      Warning: You have{" "}
                      {progress.total - answeredCount} unanswered
                      questions. They will be marked as unanswered.
                    </span>
                  )}
                  <span className="block mt-2">
                    This action cannot be undone.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue Exam</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSubmitExam}
                  variant="destructive"
                >
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
            {/* Progress Header */}
            <div className="mb-6 flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <span className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
                  {section?.title
                    ? `${section.title} — Question ${progress.current} of ${progress.total}`
                    : `Question ${progress.current} of ${progress.total}`}
                </span>
                <span className="text-primary font-bold text-sm">
                  {progressPercent}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="bg-card rounded-xl shadow-sm border border-border p-6 md:p-10 flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-muted-foreground text-sm">
                    Loading question...
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div
                role="alert"
                aria-live="assertive"
                className="bg-card rounded-xl shadow-sm border border-red-200 dark:border-red-800 p-6 md:p-10 flex-1 flex flex-col items-center justify-center gap-4"
              >
                <span className="material-symbols-outlined text-destructive text-[48px]" aria-hidden="true">
                  error
                </span>
                <p className="text-destructive font-medium text-center">
                  {error}
                </p>
                <button
                  onClick={fetchCurrentQuestion}
                  className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* All Questions Answered State */}
            {allAnswered && !loading && !error && (
              <div className="bg-card rounded-xl shadow-sm border border-border p-6 md:p-10 flex-1 flex flex-col items-center justify-center gap-6">
                <span className="material-symbols-outlined text-green-500 text-[64px]">
                  check_circle
                </span>
                <div className="text-center">
                  <h2 className="text-foreground text-2xl font-bold mb-2">
                    All Questions Answered!
                  </h2>
                  <p className="text-muted-foreground">
                    You have answered all questions. You can now submit your
                    exam.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      disabled={submitting}
                      className="flex items-center gap-2 px-8 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20 transition-all hover:shadow-primary/30 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        send
                      </span>
                      Submit Exam
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You have answered all {progress.total} questions. Are you
                        ready to submit?
                        <span className="block mt-2">
                          This action cannot be undone.
                        </span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Continue Exam</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSubmitExam}
                        variant="destructive"
                      >
                        Submit Exam
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {/* Question Card */}
            {question && !loading && !error && !allAnswered && (
              <div className="bg-card rounded-xl shadow-sm border border-border p-6 md:p-10 flex-1 flex flex-col">
                <QuestionDisplay
                  question={question}
                  selectedAnswer={selectedAnswer}
                  onSelect={setSelectedAnswer}
                  questionNumber={progress.current}
                />

                {/* Question Image */}
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

                {/* Action Buttons */}
                <div className="flex items-center justify-end mt-8 pt-6 border-t border-border">
                  <button
                    onClick={handleNext}
                    disabled={!selectedAnswer || submitting}
                    className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20 transition-all hover:shadow-primary/30 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Next
                        <span className="material-symbols-outlined text-[20px]">
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Footer Info */}
            <div className="mt-4 text-center text-muted-foreground text-xs">
              Attempt: {attemptId.slice(0, 8)}... &bull; Time remaining:{" "}
              {formatted}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
