"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  MinusCircle,
  LayoutList,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type QuestionRow = {
  id: string;
  questionText: string;
  questionType: string;
  options: { id: string; text: string }[] | null;
  correctAnswer: string;
  marks: number;
  selectedAnswer: string | null;
  isCorrect: boolean;
  marksAwarded: number;
  timeSpentSec: number | null;
};

export type SectionRow = {
  id: string;
  title: string;
  correct: number;
  wrong: number;
  unanswered: number;
  scoreEarned: number;
  scoreMax: number;
  questions: QuestionRow[];
};

interface SectionBreakdownProps {
  sections: SectionRow[];
  passingPercentage: number;
}

function getAnswerText(
  answer: string | null,
  options: { id: string; text: string }[] | null
): string {
  if (!answer) return "Not answered";
  if (!options?.length) return answer;
  return options.find((o) => o.id === answer)?.text ?? answer;
}

function formatTime(secs: number | null): string {
  if (secs == null) return "—";
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function questionTypeLabel(type: string) {
  if (type === "true_false") return "True/False";
  if (type === "fill_blank") return "Fill Blank";
  if (type === "essay") return "Essay";
  return "MCQ";
}

export function SectionBreakdown({
  sections,
  passingPercentage,
}: SectionBreakdownProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (sections.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <LayoutList className="h-4 w-4 text-muted-foreground" />
          Section-wise Breakdown
          <span className="text-xs font-normal text-muted-foreground ml-1">
            (click a row to view questions)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-6 pl-4" />
              <TableHead>Section</TableHead>
              <TableHead className="text-center">Questions</TableHead>
              <TableHead className="text-center text-emerald-600 dark:text-emerald-400">
                Correct
              </TableHead>
              <TableHead className="text-center text-red-600 dark:text-red-400">
                Wrong
              </TableHead>
              <TableHead className="text-center text-slate-500">
                Unanswered
              </TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections.map((sec) => {
              const isOpen = expanded === sec.id;
              const total = sec.correct + sec.wrong + sec.unanswered;
              const pct =
                sec.scoreMax > 0
                  ? (sec.scoreEarned / sec.scoreMax) * 100
                  : 0;

              return (
                <>
                  {/* Section summary row */}
                  <TableRow
                    key={sec.id}
                    className="cursor-pointer hover:bg-muted/60 select-none"
                    onClick={() =>
                      setExpanded((prev) => (prev === sec.id ? null : sec.id))
                    }
                  >
                    <TableCell className="pl-4">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{sec.title}</TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {total}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {sec.correct}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {sec.wrong}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-slate-500">
                      {sec.unanswered}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {sec.scoreEarned} / {sec.scoreMax}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          pct >= passingPercentage
                            ? "font-medium text-emerald-600 dark:text-emerald-400"
                            : "font-medium text-red-600 dark:text-red-400"
                        }
                      >
                        {pct.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>

                  {/* Expanded question rows */}
                  {isOpen &&
                    sec.questions.map((q, idx) => {
                      const isUnanswered = !q.selectedAnswer;
                      return (
                        <TableRow
                          key={q.id}
                          className="bg-muted/30 text-sm"
                        >
                          {/* chevron placeholder */}
                          <TableCell className="pl-4 text-muted-foreground text-xs">
                            {idx + 1}
                          </TableCell>
                          {/* Question text spans Section column */}
                          <TableCell
                            colSpan={2}
                            className="max-w-[260px] truncate text-muted-foreground"
                          >
                            <span className="block truncate">
                              {q.questionText}
                            </span>
                            <Badge
                              variant="outline"
                              className="mt-1 text-xs"
                            >
                              {questionTypeLabel(q.questionType)}
                            </Badge>
                          </TableCell>
                          {/* Correct icon */}
                          <TableCell className="text-center">
                            {isUnanswered ? (
                              <MinusCircle className="mx-auto h-4 w-4 text-slate-400" />
                            ) : q.isCorrect ? (
                              <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="mx-auto h-4 w-4 text-red-500" />
                            )}
                          </TableCell>
                          {/* Selected answer */}
                          <TableCell
                            colSpan={2}
                            className={
                              isUnanswered
                                ? "text-muted-foreground italic text-xs"
                                : "text-xs"
                            }
                          >
                            <span className="block">
                              <span className="text-muted-foreground">
                                Ans:{" "}
                              </span>
                              {getAnswerText(q.selectedAnswer, q.options)}
                            </span>
                            {!q.isCorrect && !isUnanswered && (
                              <span className="block text-emerald-600 dark:text-emerald-400">
                                <span className="text-muted-foreground">
                                  Correct:{" "}
                                </span>
                                {getAnswerText(q.correctAnswer, q.options)}
                              </span>
                            )}
                          </TableCell>
                          {/* Marks */}
                          <TableCell className="text-right font-medium">
                            {q.marksAwarded} / {q.marks}
                          </TableCell>
                          {/* Time */}
                          <TableCell className="text-right text-muted-foreground text-xs">
                            {formatTime(q.timeSpentSec)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
