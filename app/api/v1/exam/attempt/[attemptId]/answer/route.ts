import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getVerifiedCandidateSession } from "@/lib/session";
import {
  isAttemptExpired,
  computeAndSubmitAttempt,
  getOrderedQuestions,
} from "@/lib/exam-engine";

const answerBodySchema = z.object({
  questionId: z.string().uuid("questionId must be a valid UUID"),
  selectedAnswer: z.string().min(1, "selectedAnswer is required").max(10000),
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

  const parseResult = answerBodySchema.safeParse(await request.json());
  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues[0].message },
      { status: 400 }
    );
  }
  const { questionId, selectedAnswer } = parseResult.data;

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

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: {
      questionType: true,
      correctAnswer: true,
      marks: true,
      sectionId: true,
    },
  });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const isEssay = question.questionType === "essay";
  const isCorrect = isEssay ? false : selectedAnswer === question.correctAnswer;
  let marksAwarded = 0;
  if (!isEssay) {
    if (isCorrect) {
      marksAwarded = Number(question.marks);
    } else {
      const exam = await prisma.exam.findUnique({
        where: { id: attempt.examId },
        select: { allowNegativeMarking: true, negativeMarkValue: true },
      });
      if (exam?.allowNegativeMarking) {
        marksAwarded = -Number(exam.negativeMarkValue);
      }
    }
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
        throw new Error("ALREADY_ANSWERED");
      }

      await Promise.all([
        tx.response.create({
          data: {
            attemptId,
            questionId,
            sectionId: question.sectionId,
            selectedAnswer,
            isCorrect,
            marksAwarded,
          },
        }),
        tx.examAttempt.update({
          where: { id: attemptId },
          data: { currentQuestionId: nextQuestionId },
        }),
      ]);
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "ALREADY_ANSWERED") {
      return NextResponse.json(
        { error: "Already answered this question" },
        { status: 400 }
      );
    }
    console.error("[answer/route] Unhandled error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
