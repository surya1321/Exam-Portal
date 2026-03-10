import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Trophy,
  Clock,
  Target,
  Hash,
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
          section: { select: { title: true } },
        },
        orderBy: { answeredAt: "asc" },
      },
    },
  });

  if (!attempt || attempt.examId !== examId) notFound();

  // Compute score and pass/fail
  const totalScore = Number(attempt.totalScore);
  const totalMarks = attempt.exam.totalMarks;
  const passingPercentage = Number(attempt.exam.passingPercentage);
  const percentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
  const passed = percentage >= passingPercentage;

  const { totalCorrect, totalWrong, totalUnanswered } = attempt;

  // Helper to get display text for a selected answer
  function getAnswerDisplayText(
    selectedAnswer: string | null,
    options: Option[] | null
  ): string {
    if (!selectedAnswer) return "Not answered";
    if (!options || options.length === 0) return selectedAnswer;
    const option = options.find((o) => o.id === selectedAnswer);
    return option ? option.text : selectedAnswer;
  }

  // Helper to get display text for the correct answer
  function getCorrectAnswerDisplayText(
    correctAnswer: string,
    options: Option[] | null
  ): string {
    if (!options || options.length === 0) return correctAnswer;
    const option = options.find((o) => o.id === correctAnswer);
    return option ? option.text : correctAnswer;
  }

  // Format time spent
  function formatTimeSpent(seconds: number | null): string {
    if (seconds === null || seconds === undefined) return "---";
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/admin/exams/${examId}/results`}>
          <ArrowLeft className="h-4 w-4" />
          Back to Results
        </Link>
      </Button>

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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 pb-4 pt-4">
            <Target className="h-5 w-5 text-blue-500" />
            <span className="text-2xl font-bold">{totalScore}</span>
            <span className="text-muted-foreground text-xs">Total Score</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center gap-1 pb-4 pt-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {totalCorrect}
            </span>
            <span className="text-muted-foreground text-xs">Correct</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center gap-1 pb-4 pt-4">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {totalWrong}
            </span>
            <span className="text-muted-foreground text-xs">Wrong</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center gap-1 pb-4 pt-4">
            <MinusCircle className="h-5 w-5 text-slate-400" />
            <span className="text-2xl font-bold text-slate-500 dark:text-slate-400">
              {totalUnanswered}
            </span>
            <span className="text-muted-foreground text-xs">Unanswered</span>
          </CardContent>
        </Card>
      </div>

      <Separator className="mb-6" />

      {/* Per-question table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Question-by-Question Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attempt.responses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MinusCircle className="text-muted-foreground mb-2 h-8 w-8 opacity-50" />
              <p className="text-muted-foreground text-sm">
                No responses recorded for this attempt.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead className="min-w-[200px]">
                    Question Text
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Selected Answer</TableHead>
                  <TableHead>Correct Answer</TableHead>
                  <TableHead className="text-center">Correct?</TableHead>
                  <TableHead className="text-right">Marks</TableHead>
                  <TableHead className="text-right">Time Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempt.responses.map((response, index) => {
                  const options = response.question.options as
                    | Option[]
                    | null;
                  const isUnanswered = !response.selectedAnswer;

                  return (
                    <TableRow key={response.id}>
                      <TableCell className="text-muted-foreground font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {response.section.title}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm">
                        {response.question.questionText}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {response.question.questionType === "true_false"
                            ? "True/False"
                            : response.question.questionType === "fill_blank"
                              ? "Fill Blank"
                              : "MCQ"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={
                          isUnanswered
                            ? "text-muted-foreground italic text-sm"
                            : "text-sm"
                        }
                      >
                        {getAnswerDisplayText(
                          response.selectedAnswer,
                          options
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getCorrectAnswerDisplayText(
                          response.question.correctAnswer,
                          options
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {isUnanswered ? (
                          <MinusCircle className="mx-auto h-4 w-4 text-slate-400" />
                        ) : response.isCorrect ? (
                          <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="mx-auto h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(response.marksAwarded)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right text-sm">
                        {formatTimeSpent(response.timeSpentSec)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
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
