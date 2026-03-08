import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getTimeRemaining } from "@/lib/exam-engine";
import { ExamClient } from "./exam-client";

export default async function ExamAttemptPage({
  params,
}: {
  params: Promise<{ accessLink: string; attemptId: string }>;
}) {
  const { accessLink, attemptId } = await params;

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        select: { title: true, accessLink: true, durationMinutes: true },
      },
      candidate: { select: { fullName: true } },
    },
  });

  if (!attempt) return notFound();
  if (attempt.exam.accessLink !== accessLink) return notFound();

  // If already completed, redirect to results
  if (attempt.status !== "in_progress") {
    redirect(`/exam/${accessLink}/result/${attemptId}`);
  }

  const timeRemaining = await getTimeRemaining(attemptId);

  return (
    <ExamClient
      attemptId={attemptId}
      accessLink={accessLink}
      examTitle={attempt.exam.title}
      candidateName={attempt.candidate.fullName}
      initialTimeRemaining={timeRemaining}
    />
  );
}
