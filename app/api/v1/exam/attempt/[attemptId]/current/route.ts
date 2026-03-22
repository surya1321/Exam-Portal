import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedCandidateSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import {
  getTimeRemaining,
  isAttemptExpired,
  computeAndSubmitAttempt,
  getNextQuestion,
  getOrderedQuestions,
} from "@/lib/exam-engine";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;

  const session = await getVerifiedCandidateSession(attemptId);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = rateLimit(`current:${attemptId}`, 20);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: {
      status: true,
      examId: true,
    },
  });
  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }
  if (attempt.status !== "in_progress") {
    return NextResponse.json({ error: "Attempt already completed" }, { status: 409 });
  }

  if (await isAttemptExpired(attemptId)) {
    await computeAndSubmitAttempt(attemptId);
    return NextResponse.json(
      { error: "Time expired", status: "timed_out" },
      { status: 410 }
    );
  }

  const examWindow = await prisma.exam.findUnique({
    where: { id: attempt.examId },
    select: { expiresAt: true },
  });
  if (examWindow?.expiresAt && new Date() > examWindow.expiresAt) {
    await computeAndSubmitAttempt(attemptId);
    return NextResponse.json(
      { error: "Exam window has expired", status: "expired" },
      { status: 410 }
    );
  }

  const allQuestions = await getOrderedQuestions(attempt.examId);
  const next = await getNextQuestion(attemptId, allQuestions);

  if (!next) {
    return NextResponse.json({ allAnswered: true });
  }

  const [timeRemaining, answeredCount] = await Promise.all([
    getTimeRemaining(attemptId),
    prisma.response.count({ where: { attemptId } }),
  ]);

  return NextResponse.json({
    question: {
      id: next.id,
      text: next.questionText,
      type: next.questionType,
      options: next.options,
      marks: Number(next.marks),
      imageUrl: next.imageUrl,
    },
    section: {
      id: next.sectionId,
      title: next.sectionTitle,
    },
    progress: {
      current: answeredCount + 1,
      total: allQuestions.length,
    },
    timeRemaining,
  });
}
