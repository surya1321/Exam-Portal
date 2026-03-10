import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, TrendingUp, Percent } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { ResultsTable } from "./results-table";

type ResultsPageProps = {
  params: Promise<{ examId: string }>;
};

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { examId } = await params;
  const admin = await requireAdmin();

  const exam = await prisma.exam.findFirst({
    where: { id: examId, adminId: admin.id },
    select: {
      id: true,
      title: true,
      totalMarks: true,
      passingPercentage: true,
      isPublished: true,
    },
  });

  if (!exam) notFound();

  const attempts = await prisma.examAttempt.findMany({
    where: { examId },
    include: {
      candidate: {
        select: { fullName: true, email: true },
      },
    },
    orderBy: { totalScore: "desc" },
  });

  const totalMarks = exam.totalMarks;
  const passingPercentage = Number(exam.passingPercentage);

  const attemptsData = attempts.map((attempt) => ({
    id: attempt.id,
    candidateId: attempt.candidateId,
    candidateName: attempt.candidate.fullName,
    candidateEmail: attempt.candidate.email,
    totalScore: Number(attempt.totalScore),
    totalCorrect: attempt.totalCorrect,
    totalWrong: attempt.totalWrong,
    totalUnanswered: attempt.totalUnanswered,
    status: attempt.status as string,
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
  }));

  const totalAttempts = attemptsData.length;
  const averageScore =
    totalAttempts > 0
      ? attemptsData.reduce((sum, a) => sum + a.totalScore, 0) / totalAttempts
      : 0;
  const passCount =
    totalMarks > 0
      ? attemptsData.filter(
        (a) => (a.totalScore / totalMarks) * 100 >= passingPercentage
      ).length
      : 0;
  const passRate = totalAttempts > 0 ? (passCount / totalAttempts) * 100 : 0;

  const stats = [
    { label: "Total Attempts", value: String(totalAttempts), icon: Users, color: "text-primary" },
    { label: "Average Score", value: `${averageScore.toFixed(1)} / ${totalMarks}`, icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Pass Rate", value: `${passRate.toFixed(1)}%`, icon: Percent, color: "text-amber-600 dark:text-amber-400" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/admin/exams/${examId}`}>
          <ArrowLeft className="h-4 w-4" />
          Back to Exam
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{exam.title}</h1>
        <Badge
          variant={exam.isPublished ? "default" : "secondary"}
          className={
            exam.isPublished
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
              : ""
          }
        >
          {exam.isPublished ? "Published" : "Draft"}
        </Badge>
      </div>

      {/* Sub-navigation */}
      <nav className="flex items-center gap-1 border-b">
        <Link
          href={`/admin/exams/${examId}`}
          className="border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Overview
        </Link>
        <Link
          href={`/admin/exams/${examId}/candidates`}
          className="border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Candidates
        </Link>
        <Link
          href={`/admin/exams/${examId}/results`}
          className="border-b-2 border-primary px-4 py-2.5 text-sm font-medium text-primary"
        >
          Results
        </Link>
        <Link
          href={`/admin/exams/${examId}/analytics`}
          className="border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Analytics
        </Link>
      </nav>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Results table */}
      <ResultsTable
        examId={examId}
        totalMarks={totalMarks}
        passingPercentage={passingPercentage}
        attempts={attemptsData}
      />
    </div>
  );
}
