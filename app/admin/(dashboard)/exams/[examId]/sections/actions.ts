"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  createSectionSchema,
  updateSectionSchema,
} from "@/lib/validations/section";
import {
  createQuestionSchema,
  updateQuestionSchema,
} from "@/lib/validations/question";
import { revalidatePath } from "next/cache";

// Helper to verify admin owns the exam
async function verifyExamOwnership(examId: string) {
  const admin = await requireAdmin();
  const exam = await prisma.exam.findFirst({
    where: { id: examId, adminId: admin.id },
  });
  if (!exam) throw new Error("Exam not found");
  return exam;
}

// Recalculate total marks for an exam
async function recalculateExamMarks(examId: string) {
  const result = await prisma.question.aggregate({
    where: { section: { examId } },
    _sum: { marks: true },
  });
  await prisma.exam.update({
    where: { id: examId },
    data: { totalMarks: Math.round(Number(result._sum.marks ?? 0)) },
  });
}

// --- Section Actions ---

export async function createSection(examId: string, input: unknown) {
  await verifyExamOwnership(examId);
  const parsed = createSectionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const section = await prisma.section.create({
    data: { ...parsed.data, examId },
  });

  revalidatePath(`/admin/exams/${examId}`);
  return { data: section };
}

export async function updateSection(
  examId: string,
  sectionId: string,
  input: unknown
) {
  await verifyExamOwnership(examId);
  const parsed = updateSectionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const section = await prisma.section.update({
    where: { id: sectionId },
    data: parsed.data,
  });

  revalidatePath(`/admin/exams/${examId}`);
  return { data: section };
}

export async function deleteSection(examId: string, sectionId: string) {
  await verifyExamOwnership(examId);
  await prisma.section.delete({ where: { id: sectionId } });
  await recalculateExamMarks(examId);
  revalidatePath(`/admin/exams/${examId}`);
  return { success: true } as { success: boolean; error?: string };
}

// --- Question Actions ---

export async function createQuestion(
  examId: string,
  sectionId: string,
  input: unknown
) {
  await verifyExamOwnership(examId);
  const parsed = createQuestionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const question = await prisma.question.create({
    data: {
      ...parsed.data,
      sectionId,
      options: parsed.data.options ?? undefined,
    },
  });

  await recalculateExamMarks(examId);
  revalidatePath(`/admin/exams/${examId}`);
  return { data: question };
}

export async function updateQuestion(
  examId: string,
  questionId: string,
  input: unknown
) {
  await verifyExamOwnership(examId);
  const parsed = updateQuestionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const question = await prisma.question.update({
    where: { id: questionId },
    data: {
      ...parsed.data,
      options: parsed.data.options ?? undefined,
    },
  });

  await recalculateExamMarks(examId);
  revalidatePath(`/admin/exams/${examId}`);
  return { data: question };
}

export async function deleteQuestion(examId: string, questionId: string) {
  await verifyExamOwnership(examId);
  await prisma.question.delete({ where: { id: questionId } });
  await recalculateExamMarks(examId);
  revalidatePath(`/admin/exams/${examId}`);
  return { success: true } as { success: boolean; error?: string };
}
