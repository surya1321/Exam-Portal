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
  const { questionId, selectedAnswer } = body;

  if (!questionId || !selectedAnswer) {
    return NextResponse.json(
      { error: "questionId and selectedAnswer are required" },
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
      { error: "Cannot answer this question (forward-only)" },
      { status: 400 }
    );
  }

  // Get the question details
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { section: true },
  });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  // Compute correctness and marks
  // Essay questions are not auto-graded; they're stored as pending review
  const isEssay = question.questionType === "essay";
  const isCorrect = isEssay ? false : selectedAnswer === question.correctAnswer;
  let marksAwarded = 0;
  if (!isEssay) {
    if (isCorrect) {
      marksAwarded = Number(question.marks);
    } else {
      const exam = await prisma.exam.findUnique({
        where: { id: attempt.examId },
      });
      if (exam?.allowNegativeMarking) {
        marksAwarded = -Number(exam.negativeMarkValue);
      }
    }
  }

  // Transaction: atomically check + create response + advance cursor
  try {
    await prisma.$transaction(async (tx) => {
      const existingResponse = await tx.response.findUnique({
        where: { attemptId_questionId: { attemptId, questionId } },
      });
      if (existingResponse) {
        throw new Error("ALREADY_ANSWERED");
      }

      await tx.response.create({
        data: {
          attemptId,
          questionId,
          sectionId: question.sectionId,
          selectedAnswer,
          isCorrect,
          marksAwarded,
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
    if (err instanceof Error && err.message === "ALREADY_ANSWERED") {
      return NextResponse.json(
        { error: "Already answered this question" },
        { status: 400 }
      );
    }
    throw err;
  }

  // Prefetch: return the next question inline to avoid a separate GET /current call
  const allQuestions = await getOrderedQuestions(attempt.examId);
  const nextQ = await getNextQuestion(attemptId, allQuestions);
  const answeredCount = await prisma.response.count({ where: { attemptId } });

  if (!nextQ) {
    return NextResponse.json({
      success: true,
      isCorrect,
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
    isCorrect,
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
