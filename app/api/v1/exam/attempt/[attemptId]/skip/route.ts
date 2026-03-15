import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isAttemptExpired,
  computeAndSubmitAttempt,
  getOrderedQuestions,
} from "@/lib/exam-engine";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;
  const body = await request.json();
  const { questionId } = body;

  if (!questionId) {
    return NextResponse.json(
      { error: "questionId is required" },
      { status: 400 }
    );
  }

  // Select only the fields needed for validation — avoids loading full row
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: {
      status: true,
      examId: true,
    },
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



  // Get the question's sectionId — select only the field we need
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { sectionId: true },
  });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  // Preload ordered questions BEFORE the transaction to reduce transaction lock duration
  const allQuestions = await getOrderedQuestions(attempt.examId);

  // Compute next question ID from the ordered list (avoids querying inside the transaction)
  const currentIndex = allQuestions.findIndex((q) => q.id === questionId);
  const nextQuestionId = currentIndex >= 0 && currentIndex < allQuestions.length - 1
    ? allQuestions[currentIndex + 1].id
    : null;

  // Transaction: atomically check + create skip response + advance cursor
  try {
    await prisma.$transaction(async (tx) => {
      const existingResponse = await tx.response.findUnique({
        where: { attemptId_questionId: { attemptId, questionId } },
        select: { id: true }, // Only check existence
      });
      if (existingResponse) {
        throw new Error("ALREADY_RESPONDED");
      }

      // Batch: create response + advance cursor in parallel within transaction
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
          data: {
            currentQuestionId: nextQuestionId,
          },
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
    throw err;
  }

  return NextResponse.json({ success: true, skipped: true });
}
