import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isAttemptExpired,
  computeAndSubmitAttempt,
  getNextQuestion,
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
      currentQuestionId: true,
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

  // Forward-only: verify the question is the current one
  if (attempt.currentQuestionId !== questionId) {
    return NextResponse.json(
      { error: "Cannot skip this question (forward-only)" },
      { status: 400 }
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

      // Compute next question from preloaded data
      const nextQuestion = await getNextQuestion(attemptId, allQuestions);

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
            currentQuestionId: nextQuestion?.id || null,
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

  // Reuse the preloaded questions — no redundant getOrderedQuestions call
  const nextQ = await getNextQuestion(attemptId, allQuestions);
  const answeredCount = await prisma.response.count({ where: { attemptId } });

  if (!nextQ) {
    return NextResponse.json({
      success: true,
      skipped: true,
      allAnswered: true,
      nextQuestion: null,
      section: null,
      progress: {
        current: answeredCount + 1,
        total: allQuestions.length,
      },
    });
  }

  return NextResponse.json({
    success: true,
    skipped: true,
    allAnswered: false,
    nextQuestion: {
      id: nextQ.id,
      text: nextQ.questionText,
      type: nextQ.questionType,
      options: nextQ.options,
      marks: Number(nextQ.marks),
      imageUrl: nextQ.imageUrl,
    },
    section: {
      id: nextQ.sectionId,
      title: nextQ.sectionTitle,
    },
    progress: {
      current: answeredCount + 1,
      total: allQuestions.length,
    },
  });
}
