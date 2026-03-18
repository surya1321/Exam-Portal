import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ExamResultPage({
  params,
}: {
  params: Promise<{ accessLink: string; attemptId: string }>;
}) {
  const { accessLink, attemptId } = await params;

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        select: {
          title: true,
          accessLink: true,
        },
      },
      candidate: { select: { fullName: true, email: true } },
    },
  });

  if (!attempt) return notFound();
  if (attempt.exam.accessLink !== accessLink) return notFound();
  if (attempt.status === "in_progress") return notFound();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {attempt.exam.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {attempt.candidate.fullName}
          </p>
        </div>
      </header>

      {/* Thank You Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <div className="max-w-md w-full text-center space-y-8 py-16">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-950/40 border-4 border-emerald-500">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Thank You for Attempting the Exam!
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              Your responses have been submitted successfully. Results will be
              shared to your email once they are reviewed.
            </p>
          </div>

          {/* Email Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <span>{attempt.candidate.email}</span>
          </div>

          {/* Additional info */}
          <div className="space-y-2 pt-4">
            <p className="text-xs text-muted-foreground">
              Attempt submitted on{" "}
              {attempt.submittedAt
                ? new Date(attempt.submittedAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "---"}
            </p>
            <p className="text-xs text-muted-foreground">
              Attempt ID: {attemptId.slice(0, 8)}...
            </p>
          </div>

          {/* Back button */}
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
