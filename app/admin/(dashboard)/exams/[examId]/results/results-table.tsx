"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpDown, Download, Eye, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AttemptRow = {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  totalScore: number;
  totalCorrect: number;
  totalWrong: number;
  totalUnanswered: number;
  status: string;
  startedAt: string;
  submittedAt: string | null;
};

type SortKey =
  | "rank"
  | "candidateName"
  | "totalScore"
  | "percentage"
  | "submittedAt";

type SortDirection = "asc" | "desc";

interface ResultsTableProps {
  examId: string;
  totalMarks: number;
  passingPercentage: number;
  attempts: AttemptRow[];
}

export function ResultsTable({
  examId,
  totalMarks,
  passingPercentage,
  attempts,
}: ResultsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("totalScore");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "candidateName" ? "asc" : "desc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...attempts];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "rank":
        case "totalScore":
        case "percentage":
          cmp = a.totalScore - b.totalScore;
          break;
        case "candidateName":
          cmp = a.candidateName.localeCompare(b.candidateName);
          break;
        case "submittedAt": {
          const aTime = a.submittedAt
            ? new Date(a.submittedAt).getTime()
            : 0;
          const bTime = b.submittedAt
            ? new Date(b.submittedAt).getTime()
            : 0;
          cmp = aTime - bTime;
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [attempts, sortKey, sortDir]);

  // Compute rank based on score (descending). Equal scores get the same rank.
  const ranked = useMemo(() => {
    const byScore = [...attempts].sort((a, b) => b.totalScore - a.totalScore);
    const rankMap = new Map<string, number>();
    let currentRank = 1;
    for (let i = 0; i < byScore.length; i++) {
      if (i > 0 && byScore[i].totalScore < byScore[i - 1].totalScore) {
        currentRank = i + 1;
      }
      rankMap.set(byScore[i].id, currentRank);
    }
    return rankMap;
  }, [attempts]);

  function SortButton({
    label,
    field,
  }: {
    label: string;
    field: SortKey;
  }) {
    return (
      <button
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => handleSort(field)}
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <Users className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="mb-1 text-lg font-semibold">No attempts yet</h3>
        <p className="text-muted-foreground text-sm">
          No candidates have attempted this exam yet.
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          All Results ({attempts.length})
        </CardTitle>
        <Button variant="outline" size="sm" asChild>
          <a
            href={`/api/v1/admin/exams/${examId}/results/export`}
            download
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </a>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <SortButton label="#" field="rank" />
              </TableHead>
              <TableHead>
                <SortButton label="Candidate" field="candidateName" />
              </TableHead>
              <TableHead>
                <SortButton label="Score" field="totalScore" />
              </TableHead>
              <TableHead>
                <SortButton label="Percentage" field="percentage" />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attempt Status</TableHead>
              <TableHead>
                <SortButton label="Submitted At" field="submittedAt" />
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((attempt) => {
              const percentage =
                totalMarks > 0
                  ? (attempt.totalScore / totalMarks) * 100
                  : 0;
              const passed = percentage >= passingPercentage;
              const rank = ranked.get(attempt.id) ?? 0;

              return (
                <TableRow key={attempt.id}>
                  <TableCell className="font-medium text-muted-foreground">
                    {rank}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{attempt.candidateName}</p>
                      <p className="text-xs text-muted-foreground">{attempt.candidateEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {attempt.totalScore} / {totalMarks}
                  </TableCell>
                  <TableCell>{percentage.toFixed(1)}%</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        passed
                          ? "bg-emerald-600 text-white hover:bg-emerald-600/90"
                          : "bg-red-600 text-white hover:bg-red-600/90"
                      }
                    >
                      {passed ? "Pass" : "Fail"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        attempt.status === "completed"
                          ? "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
                          : attempt.status === "timed_out"
                            ? "border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400"
                            : ""
                      }
                    >
                      {attempt.status === "timed_out"
                        ? "Timed Out"
                        : attempt.status === "completed"
                          ? "Completed"
                          : attempt.status === "in_progress"
                            ? "In Progress"
                            : attempt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {attempt.submittedAt
                      ? new Date(attempt.submittedAt).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                      : "---"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link
                        href={`/admin/exams/${examId}/results/${attempt.id}`}
                        title="View detail"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
