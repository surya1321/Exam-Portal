"use client";

import { useState, useEffect, useCallback } from "react";
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
};

export function ExamClient({
  attemptId,
  accessLink,
  examTitle,
  candidateName,
  initialTimeRemaining,
}: ExamClientProps) {
  const router = useRouter();
  const { seconds, formatted, isExpired } = useExamTimer(
    attemptId,
    initialTimeRemaining
  );

  const [question, setQuestion] = useState<Question | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [progress, setProgress] = useState<Progress>({ current: 1, total: 1 });
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [allAnswered, setAllAnswered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apply prefetched question data from an API response
  function applyPrefetchedData(data: {
    allAnswered: boolean;
    nextQuestion: Question | null;
    section: Section | null;
    progress: Progress;
  }) {
    if (data.allAnswered) {
      setAllAnswered(true);
      setQuestion(null);
      setLoading(false);
      return;
    }
    if (data.nextQuestion) {
      setQuestion(data.nextQuestion);
      setSection(data.section);
      setProgress(data.progress);
      setSelectedAnswer(null);
      setAllAnswered(false);
      setLoading(false);
    }
  }

  // Fetch current question
  const fetchCurrentQuestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/exam/attempt/${attemptId}/current`);
      if (res.status === 410) {
        // Time expired — server already submitted
        router.push(`/exam/${accessLink}/result/${attemptId}`);
        return;
      }
      if (res.status === 403) {
        // Attempt invalid or completed
        router.push(`/exam/${accessLink}/result/${attemptId}`);
        return;
      }
      if (!res.ok) {
        setError("Failed to load question. Please try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.allAnswered) {
        setAllAnswered(true);
        setQuestion(null);
        setLoading(false);
        return;
      }

      setQuestion(data.question);
      setSection(data.section);
      setProgress(data.progress);
      setSelectedAnswer(null);
      setAllAnswered(false);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [attemptId, accessLink, router]);

  // Load first question on mount
  useEffect(() => {
    fetchCurrentQuestion();
  }, [fetchCurrentQuestion]);

  // Auto-submit on timer expiry
  useEffect(() => {
    if (isExpired && !submitting) {
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
      applyPrefetchedData(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Skip question
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

      if (res.status === 410) {
        router.push(`/exam/${accessLink}/result/${attemptId}`);
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to skip question.");
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      applyPrefetchedData(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Submit entire exam
  async function handleSubmitExam() {
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
      ? Math.round(((progress.current - 1) / progress.total) * 100)
      : 0;

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border bg-card px-6 py-3 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4 text-foreground">
          <div className="flex items-center justify-center rounded-lg bg-primary/10 overflow-hidden">
            <Image
              src="/GC LOGO.png"
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
          <Timer formatted={formatted} seconds={seconds} />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-lg h-9 px-4 bg-primary hover:bg-blue-700 text-white text-sm font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Submit Exam</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to submit your exam? You have answered{" "}
                  {progress.current - 1} of {progress.total} questions.
                  {progress.current - 1 < progress.total && (
                    <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">
                      Warning: You have{" "}
                      {progress.total - (progress.current - 1)} unanswered
                      questions. They will be marked as skipped.
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
              <div className="bg-card rounded-xl shadow-sm border border-red-200 dark:border-red-800 p-6 md:p-10 flex-1 flex flex-col items-center justify-center gap-4">
                <span className="material-symbols-outlined text-red-500 text-[48px]">
                  error
                </span>
                <p className="text-red-600 dark:text-red-400 font-medium text-center">
                  {error}
                </p>
                <button
                  onClick={fetchCurrentQuestion}
                  className="px-6 py-2.5 rounded-lg bg-primary hover:bg-blue-700 text-white font-semibold transition-colors"
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
                      className="flex items-center gap-2 px-8 py-3 rounded-lg bg-primary hover:bg-blue-700 text-white font-semibold shadow-md shadow-primary/20 transition-all hover:shadow-primary/30 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <AlertDialogCancel>Review</AlertDialogCancel>
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
                  <div className="mt-4 rounded-lg overflow-hidden border border-border">
                    <img
                      src={question.imageUrl}
                      alt="Question illustration"
                      className="max-w-full h-auto max-h-80 object-contain mx-auto"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                  <button
                    onClick={handleSkip}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      skip_next
                    </span>
                    Skip
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!selectedAnswer || submitting}
                    className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-primary hover:bg-blue-700 text-white font-semibold shadow-md shadow-primary/20 transition-all hover:shadow-primary/30 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
