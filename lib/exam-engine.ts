import { prisma } from "@/lib/prisma";
import type { Prisma } from "./generated/prisma/client";
import type { QuestionType } from "./generated/prisma/client";

/** Projected question type — only the fields selected in getOrderedQuestions */
export type OrderedQuestion = {
  id: string;
  questionText: string;
  questionType: QuestionType;
  options: Prisma.JsonValue;
  marks: Prisma.Decimal;
  imageUrl: string | null;
  orderIndex: number;
  sectionId: string;
  sectionTitle: string;
};

/**
 * Calculates time remaining using only the fields needed (select projection).
 * Avoids loading the entire ExamAttempt + Exam rows.
 */
export async function getTimeRemaining(attemptId: string): Promise<number> {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: {
      startedAt: true,
      exam: { select: { durationMinutes: true } },
    },
  });
  if (!attempt) return 0;

  const elapsed = (Date.now() - new Date(attempt.startedAt).getTime()) / 1000;
  const totalSeconds = attempt.exam.durationMinutes * 60;
  return Math.max(0, Math.floor(totalSeconds - elapsed));
}

export async function isAttemptExpired(attemptId: string): Promise<boolean> {
  return (await getTimeRemaining(attemptId)) <= 0;
}

/**
 * Fetches all questions for an exam, ordered by section.orderIndex → question.orderIndex.
 * Uses select projection to avoid loading unnecessary columns (e.g. correctAnswer, explanation).
 */
export async function getOrderedQuestions(examId: string) {
  const sections = await prisma.section.findMany({
    where: { examId },
    orderBy: { orderIndex: "asc" },
    select: {
      id: true,
      title: true,
      questions: {
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          questionText: true,
          questionType: true,
          options: true,
          marks: true,
          imageUrl: true,
          orderIndex: true,
          sectionId: true,
        },
      },
    },
  });

  // Flatten sections into ordered question list with section info
  return sections.flatMap((section) =>
    section.questions.map((q) => ({
      ...q,
      sectionId: section.id,
      sectionTitle: section.title,
    }))
  );
}

/**
 * Finds the next unanswered question for an attempt.
 * Uses select projection on responses to only fetch questionId (not full Response rows).
 * Accepts preloaded questions to avoid redundant DB calls when the caller already has them.
 */
export async function getNextQuestion(
  attemptId: string,
  preloadedQuestions?: OrderedQuestion[]
) {
  // Only fetch the fields we need — avoid loading full attempt + exam rows
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: {
      examId: true,
      responses: { select: { questionId: true } },
    },
  });
  if (!attempt) return null;

  const allQuestions =
    preloadedQuestions ?? (await getOrderedQuestions(attempt.examId));
  const answeredIds = new Set(attempt.responses.map((r) => r.questionId));

  for (const question of allQuestions) {
    if (!answeredIds.has(question.id)) {
      return question;
    }
  }
  return null; // All questions answered
}

/**
 * Computes final scores and atomically submits the attempt.
 * Optimized: uses select projections and parallelizes independent queries.
 */
export async function computeAndSubmitAttempt(attemptId: string) {
  // Fetch attempt data with only the columns needed for scoring
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: {
      startedAt: true,
      exam: {
        select: {
          durationMinutes: true,
          sections: {
            select: {
              questions: {
                select: {
                  id: true,
                  questionType: true,
                },
              },
            },
          },
        },
      },
      responses: {
        select: {
          isCorrect: true,
          selectedAnswer: true,
          marksAwarded: true,
          question: { select: { questionType: true } },
        },
      },
    },
  });
  if (!attempt) return null;

  // Separate essay questions from auto-gradable ones
  const allQuestions = attempt.exam.sections.flatMap((s) => s.questions);
  const gradableQuestions = allQuestions.filter(
    (q) => (q.questionType as string) !== "essay"
  );

  const gradableResponses = attempt.responses.filter(
    (r) => (r.question.questionType as string) !== "essay"
  );

  const totalCorrect = gradableResponses.filter((r) => r.isCorrect).length;
  const totalWrong = gradableResponses.filter(
    (r) => !r.isCorrect && r.selectedAnswer
  ).length;
  const totalUnanswered =
    gradableQuestions.length - gradableResponses.length;
  const totalScore = gradableResponses.reduce(
    (sum, r) => sum + Number(r.marksAwarded),
    0
  );

  // Compute time remaining inline instead of making another DB call
  const elapsed =
    (Date.now() - new Date(attempt.startedAt).getTime()) / 1000;
  const totalSeconds = attempt.exam.durationMinutes * 60;
  const timeRemaining = Math.max(0, Math.floor(totalSeconds - elapsed));

  // Atomic status transition: only update if still "in_progress"
  const { count } = await prisma.examAttempt.updateMany({
    where: { id: attemptId, status: "in_progress" },
    data: {
      status: timeRemaining <= 0 ? "timed_out" : "completed",
      submittedAt: new Date(),
      timeRemainingSec: timeRemaining,
      totalScore,
      totalCorrect,
      totalWrong,
      totalUnanswered,
    },
  });

  // Already submitted by another request
  if (count === 0) return null;

  return prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: {
      totalScore: true,
      totalCorrect: true,
      totalWrong: true,
      totalUnanswered: true,
    },
  });
}
