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

  // Forward-only: verify the question is the current one
  if (attempt.currentQuestionId !== questionId) {
    return NextResponse.json(
      { error: "Cannot skip this question (forward-only)" },
      { status: 400 }
    );
  }

  // Get the question to retrieve sectionId
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  // Transaction: atomically check + create skip response + advance cursor
  try {
    await prisma.$transaction(async (tx) => {
      const existingResponse = await tx.response.findUnique({
        where: { attemptId_questionId: { attemptId, questionId } },
      });
      if (existingResponse) {
        throw new Error("ALREADY_RESPONDED");
      }

      await tx.response.create({
        data: {
          attemptId,
          questionId,
          sectionId: question.sectionId,
          selectedAnswer: null,
          isCorrect: false,
          marksAwarded: 0,
        },
      });

      // Advance cursor inside the transaction
      const nextQuestion = await getNextQuestion(attemptId);
      await tx.examAttempt.update({
        where: { id: attemptId },
        data: {
          currentQuestionId: nextQuestion?.id || null,
        },
      });
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

  // Prefetch: return the next question inline
  const allQuestions = await getOrderedQuestions(attempt.examId);
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
