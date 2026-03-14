import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { CandidatesClient } from "./candidates-client";

type CandidatesPageProps = {
  params: Promise<{ examId: string }>;
};

export default async function CandidatesPage({ params }: CandidatesPageProps) {
  const { examId } = await params;
  const admin = await requireAdmin();

  const exam = await prisma.exam.findFirst({
    where: { id: examId, adminId: admin.id },
    select: {
      id: true,
      title: true,
      accessLink: true,
      isPublished: true,
    },
  });

  if (!exam) notFound();

  const candidates = await prisma.candidate.findMany({
    where: { examId },
    include: {
      attempts: {
        select: { status: true, totalScore: true },
        take: 1,
        orderBy: { startedAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const candidatesData = candidates.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    email: c.email,
    isUsed: c.isUsed,
    createdAt: c.createdAt.toISOString(),
    attempts: c.attempts.map((a) => ({
      status: a.status,
      totalScore: Number(a.totalScore),
    })),
  }));

  return (
    <div className="p-6 lg:p-8 space-y-6">

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
          className="border-b-2 border-primary px-4 py-2.5 text-sm font-medium text-primary"
        >
          Candidates
        </Link>
        <Link
          href={`/admin/exams/${examId}/results`}
          className="border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
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

      {/* Client content */}
      <CandidatesClient
        examId={examId}
        examTitle={exam.title}
        accessLink={exam.accessLink}
        candidates={candidatesData}
      />
    </div>
  );
}
