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
        select: {
          title: true,
          accessLink: true,
          durationMinutes: true,
          expiresAt: true,
          sections: {
            orderBy: { orderIndex: "asc" },
            select: {
              title: true,
              orderIndex: true,
              _count: { select: { questions: true } },
            },
          },
        },
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

  // If exam window has expired, auto-submit
  if (attempt.exam.expiresAt && new Date() > attempt.exam.expiresAt) {
    const { computeAndSubmitAttempt } = await import("@/lib/exam-engine");
    await computeAndSubmitAttempt(attemptId);
    redirect(`/exam/${accessLink}/result/${attemptId}`);
  }

  const timeRemaining = await getTimeRemaining(attemptId);

  const totalQuestions = attempt.exam.sections.reduce(
    (sum, s) => sum + s._count.questions,
    0
  );

  const examSections = attempt.exam.sections.map((s) => ({
    title: s.title,
    questionCount: s._count.questions,
  }));

  return (
    <ExamClient
      attemptId={attemptId}
      accessLink={accessLink}
      examTitle={attempt.exam.title}
      candidateName={attempt.candidate.fullName}
      initialTimeRemaining={timeRemaining}
      examDurationMinutes={attempt.exam.durationMinutes}
      totalQuestions={totalQuestions}
      examSections={examSections}
    />
  );
}

