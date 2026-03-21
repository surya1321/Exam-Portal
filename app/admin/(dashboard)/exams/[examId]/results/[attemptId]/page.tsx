import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Trophy,
  Clock,
  Mail,
  User,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { SectionBreakdown, type SectionRow } from "./section-breakdown";

type Option = { id: string; text: string };

type AttemptDetailPageProps = {
  params: Promise<{ examId: string; attemptId: string }>;
};

export default async function AttemptDetailPage({
  params,
}: AttemptDetailPageProps) {
  const { examId, attemptId } = await params;
  const admin = await requireAdmin();

  // Verify the exam belongs to this admin
  const exam = await prisma.exam.findFirst({
    where: { id: examId, adminId: admin.id },
    select: { id: true },
  });

  if (!exam) notFound();

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      candidate: true,
      exam: {
        select: {
          title: true,
          totalMarks: true,
          passingPercentage: true,
        },
      },
      responses: {
        include: {
          question: true,
          section: { select: { id: true, title: true } },
        },
        orderBy: { answeredAt: "asc" },
      },
    },
  });

  if (!attempt || attempt.examId !== examId) notFound();

  // Compute overall score and pass/fail
  const totalScore = Number(attempt.totalScore);
  const totalMarks = attempt.exam.totalMarks;
  const passingPercentage = Number(attempt.exam.passingPercentage);
  const percentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
  const passed = percentage >= passingPercentage;

  const { totalCorrect, totalWrong, totalUnanswered } = attempt;

  // Build section rows for SectionBreakdown component
  const sectionMap = new Map<string, SectionRow>();
  for (const r of attempt.responses) {
    const key = r.section.id;
    if (!sectionMap.has(key)) {
      sectionMap.set(key, {
        id: key,
        title: r.section.title,
        correct: 0,
        wrong: 0,
        unanswered: 0,
        scoreEarned: 0,
        scoreMax: 0,
        questions: [],
      });
    }
    const sec = sectionMap.get(key)!;
    sec.scoreMax += Number(r.question.marks);
    sec.scoreEarned += Number(r.marksAwarded);
    if (!r.selectedAnswer) sec.unanswered++;
    else if (r.question.questionType === "essay") { /* essays pending manual review */ }
    else if (r.isCorrect) sec.correct++;
    else sec.wrong++;

    sec.questions.push({
      id: r.id,
      questionText: r.question.questionText,
      questionType: r.question.questionType,
      options: r.question.options as Option[] | null,
      correctAnswer: r.question.correctAnswer,
      marks: Number(r.question.marks),
      selectedAnswer: r.selectedAnswer,
      isCorrect: r.isCorrect,
      marksAwarded: Number(r.marksAwarded),
      timeSpentSec: r.timeSpentSec,
    });
  }
  const sectionRows = Array.from(sectionMap.values());

  return (
    <div className="p-6 lg:p-8">

      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        Attempt Detail &mdash; {attempt.exam.title}
      </h1>

      {/* Candidate info card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Candidate Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <User className="text-muted-foreground h-4 w-4 shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Name</p>
                <p className="text-sm font-medium">
                  {attempt.candidate.fullName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="text-muted-foreground h-4 w-4 shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Email</p>
                <p className="text-sm font-medium">
                  {attempt.candidate.email}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score summary */}
      <Card className="mb-6 overflow-hidden">
        <div
          className={`h-1.5 w-full ${passed ? "bg-emerald-500" : "bg-red-500"}`}
        />
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            {/* Score Circle */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex items-center justify-center w-28 h-28 rounded-full border-4 ${passed
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                    : "border-red-500 bg-red-50 dark:bg-red-950/30"
                  }`}
              >
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${passed
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-red-700 dark:text-red-400"
                      }`}
                  >
                    {totalScore}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    / {totalMarks}
                  </div>
                </div>
              </div>
            </div>

            {/* Score Details */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span
                  className={`text-3xl font-bold ${passed
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-red-700 dark:text-red-400"
                    }`}
                >
                  {percentage.toFixed(1)}%
                </span>
                <Badge
                  className={
                    passed
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                      : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800"
                  }
                >
                  <Trophy className="h-3 w-3" />
                  {passed ? "PASSED" : "FAILED"}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                Passing score: {passingPercentage}%
              </p>

              <Badge
                variant="outline"
                className="text-muted-foreground"
              >
                <Clock className="h-3 w-3" />
                {attempt.status === "timed_out"
                  ? "Timed Out"
                  : attempt.status === "completed"
                    ? "Completed"
                    : attempt.status}
              </Badge>

              {/* Inline stats strip */}
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-3">
                <span className="flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{totalCorrect}</span>
                  <span className="text-muted-foreground text-xs">Correct</span>
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="font-semibold text-red-600 dark:text-red-400">{totalWrong}</span>
                  <span className="text-muted-foreground text-xs">Wrong</span>
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  <MinusCircle className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-slate-500 dark:text-slate-400">{totalUnanswered}</span>
                  <span className="text-muted-foreground text-xs">Unanswered</span>
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  <span className="text-muted-foreground text-xs">Total:</span>
                  <span className="font-semibold">{totalScore} / {totalMarks}</span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section-wise Breakdown (expandable per-section questions) */}
      <SectionBreakdown
        sections={sectionRows}
        passingPercentage={passingPercentage}
      />

      {/* Detailed Score Interpretation */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            Detailed Score Interpretation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Performance Band */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Performance Band</p>
            <div className="relative">
              {/* Band track */}
              <div className="flex h-3 w-full overflow-hidden rounded-full">
                <div className="flex-1 bg-red-400 dark:bg-red-600" />
                <div className="flex-1 bg-amber-400 dark:bg-amber-500" />
                <div className="flex-1 bg-blue-400 dark:bg-blue-500" />
                <div className="flex-1 bg-emerald-400 dark:bg-emerald-500" />
              </div>
              {/* Score marker */}
              <div
                className="absolute top-0 flex flex-col items-center -translate-x-1/2"
                style={{ left: `${Math.min(Math.max(percentage, 0), 100)}%` }}
              >
                <div className="w-0.5 h-3 bg-foreground rounded-full" />
                <div className="mt-1 bg-foreground text-background text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                  {percentage.toFixed(1)}%
                </div>
              </div>
              {/* Band labels */}
              <div className="flex justify-between mt-6 text-[10px] text-muted-foreground">
                <span>0 — Fail</span>
                <span>{passingPercentage}% — Pass</span>
                <span>75% — Good</span>
                <span>90% — Excellent</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Key Metrics</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border bg-card p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalCorrect}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Correct</p>
              </div>
              <div className="rounded-lg border bg-card p-3 text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalWrong}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Wrong</p>
              </div>
              <div className="rounded-lg border bg-card p-3 text-center">
                <p className="text-2xl font-bold text-slate-500 dark:text-slate-400">{totalUnanswered}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Unanswered</p>
              </div>
              <div className="rounded-lg border bg-card p-3 text-center">
                <p className="text-2xl font-bold">
                  {totalCorrect + totalWrong + totalUnanswered > 0
                    ? `${Math.round((totalCorrect / (totalCorrect + totalWrong + totalUnanswered)) * 100)}%`
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Accuracy</p>
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          {sectionRows.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Strong sections */}
              {sectionRows.filter(s => s.scoreMax > 0 && (s.scoreEarned / s.scoreMax) * 100 >= passingPercentage).length > 0 && (
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Strong Sections
                  </p>
                  <ul className="space-y-2">
                    {sectionRows
                      .filter(s => s.scoreMax > 0 && (s.scoreEarned / s.scoreMax) * 100 >= passingPercentage)
                      .sort((a, b) => (b.scoreEarned / b.scoreMax) - (a.scoreEarned / a.scoreMax))
                      .map(s => {
                        const pct = Math.round((s.scoreEarned / s.scoreMax) * 100);
                        return (
                          <li key={s.id} className="flex items-center justify-between text-sm">
                            <span className="text-foreground truncate max-w-[150px]">{s.title}</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">{pct}%</span>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}

              {/* Weak sections */}
              {sectionRows.filter(s => s.scoreMax > 0 && (s.scoreEarned / s.scoreMax) * 100 < passingPercentage).length > 0 && (
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 mb-2 flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5" /> Weak Sections
                  </p>
                  <ul className="space-y-2">
                    {sectionRows
                      .filter(s => s.scoreMax > 0 && (s.scoreEarned / s.scoreMax) * 100 < passingPercentage)
                      .sort((a, b) => (a.scoreEarned / a.scoreMax) - (b.scoreEarned / b.scoreMax))
                      .map(s => {
                        const pct = Math.round((s.scoreEarned / s.scoreMax) * 100);
                        return (
                          <li key={s.id} className="flex items-center justify-between text-sm">
                            <span className="text-foreground truncate max-w-[150px]">{s.title}</span>
                            <span className="font-semibold text-red-600 dark:text-red-400 shrink-0 ml-2">{pct}%</span>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Recommendation */}
          <div className={`rounded-lg p-4 text-sm ${
            passed
              ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
          }`}>
            <p className={`font-semibold mb-1 ${passed ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
              {percentage >= 90
                ? "🎯 Recommendation: Outstanding — Highly Recommended"
                : percentage >= 75
                  ? "✅ Recommendation: Passed — Good Candidate"
                  : percentage >= passingPercentage
                    ? "⚠️ Recommendation: Passed — Marginal Performance"
                    : "❌ Recommendation: Did Not Meet Requirements"}
            </p>
            <p className={`text-xs leading-relaxed ${passed ? "text-emerald-600/80 dark:text-emerald-300/70" : "text-red-600/80 dark:text-red-300/70"}`}>
              {percentage >= 90
                ? `Scored ${percentage.toFixed(1)}% — ${totalScore} out of ${totalMarks} marks. Demonstrates exceptional mastery. This candidate is an excellent fit and stands out significantly among peers.`
                : percentage >= 75
                  ? `Scored ${percentage.toFixed(1)}% — ${totalScore} out of ${totalMarks} marks. Shows solid knowledge with only minor gaps. Recommended for selection with confidence.`
                  : percentage >= passingPercentage
                    ? `Scored ${percentage.toFixed(1)}% — ${totalScore} out of ${totalMarks} marks. Narrowly meets the ${passingPercentage}% threshold. Consider reviewing weak sections before finalizing a decision.`
                    : `Scored ${percentage.toFixed(1)}% — ${totalScore} out of ${totalMarks} marks. Did not meet the passing threshold of ${passingPercentage}%. The candidate may benefit from further preparation and re-assessment.`}
            </p>
          </div>

        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-muted-foreground text-xs">
          Attempt ID: {attemptId.slice(0, 8)}...
          {attempt.submittedAt &&
            ` | Submitted: ${new Date(attempt.submittedAt).toLocaleString()}`}
        </p>
      </div>
    </div>
  );
}
