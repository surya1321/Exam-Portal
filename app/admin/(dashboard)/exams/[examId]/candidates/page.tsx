import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

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
    },
  });

  if (!exam) {
    notFound();
  }

  const candidates = await prisma.candidate.findMany({
    where: { examId },
    include: {
      attempts: { select: { status: true, totalScore: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const candidatesData = candidates.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    username: c.username,
    email: c.email,
    isUsed: c.isUsed,
    createdAt: c.createdAt.toISOString(),
    attempts: c.attempts.map((a) => ({
      status: a.status,
      totalScore: Number(a.totalScore),
    })),
  }));

  return (
    <div className="p-6 lg:p-8">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/admin/exams/${examId}`}>
          <ArrowLeft className="h-4 w-4" />
          Back to Exam
        </Link>
      </Button>

      <CandidatesClient
        examId={examId}
        examTitle={exam.title}
        accessLink={exam.accessLink}
        candidates={candidatesData}
      />
    </div>
  );
}
