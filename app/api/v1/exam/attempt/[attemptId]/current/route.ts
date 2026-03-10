import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
  });
  if (!attempt || attempt.status !== "in_progress") {
    return NextResponse.json(
      { error: "Invalid or completed attempt" },
      { status: 403 }
    );
  }

  if (await isAttemptExpired(attemptId)) {
    await computeAndSubmitAttempt(attemptId);
    return NextResponse.json(
      { error: "Time expired", status: "timed_out" },
      { status: 410 }
    );
  }

  // Fetch questions once and reuse for both getNextQuestion and progress
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
