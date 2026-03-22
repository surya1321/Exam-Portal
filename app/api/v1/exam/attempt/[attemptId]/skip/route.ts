import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { getVerifiedCandidateSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import {
  isAttemptExpired,
  computeAndSubmitAttempt,
  getOrderedQuestions,
} from "@/lib/exam-engine";

const skipBodySchema = z.object({
  questionId: z.string().uuid("questionId must be a valid UUID"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;

  const session = await getVerifiedCandidateSession(attemptId);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = rateLimit(`skip:${attemptId}`, 30);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const parseResult = skipBodySchema.safeParse(await request.json());
  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues[0].message },
      { status: 400 }
    );
  }
  const { questionId } = parseResult.data;

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: { status: true, examId: true },
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

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { sectionId: true },
  });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const section = await prisma.section.findUnique({
    where: { id: question.sectionId },
    select: { examId: true },
  });
  if (!section || section.examId !== attempt.examId) {
    return NextResponse.json({ error: "Question does not belong to this exam" }, { status: 400 });
  }

  const allQuestions = await getOrderedQuestions(attempt.examId);
  const currentIndex = allQuestions.findIndex((q) => q.id === questionId);
  const nextQuestionId =
    currentIndex >= 0 && currentIndex < allQuestions.length - 1
      ? allQuestions[currentIndex + 1].id
      : null;

  try {
    await prisma.$transaction(async (tx) => {
      const existingResponse = await tx.response.findUnique({
        where: { attemptId_questionId: { attemptId, questionId } },
        select: { id: true },
      });
      if (existingResponse) {
        throw new Error("ALREADY_RESPONDED");
      }

      await Promise.all([
        tx.response.create({
          data: {
            attemptId,
            questionId,
            sectionId: question.sectionId,
            selectedAnswer: null,
            isCorrect: false,
            marksAwarded: 0,
          },
        }),
        tx.examAttempt.update({
          where: { id: attemptId },
          data: { currentQuestionId: nextQuestionId },
        }),
      ]);
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "ALREADY_RESPONDED") {
      return NextResponse.json(
        { error: "Already responded to this question" },
        { status: 400 }
      );
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "Already answered this question" },
        { status: 400 }
      );
    }
    console.error("[skip/route] Unhandled error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, skipped: true });
}
