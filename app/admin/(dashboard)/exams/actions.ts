"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createExamSchema, updateExamSchema } from "@/lib/validations/exam";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

export async function createExam(input: unknown) {
  const admin = await requireAdmin();
  const parsed = createExamSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const exam = await prisma.exam.create({
    data: {
      ...parsed.data,
      adminId: admin.id,
      accessLink: nanoid(12),
    },
  });

  revalidatePath("/admin/exams");
  return { data: exam };
}

export async function updateExam(examId: string, input: unknown) {
  const admin = await requireAdmin();
  const parsed = updateExamSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const exam = await prisma.exam.findFirst({
    where: { id: examId, adminId: admin.id },
  });
  if (!exam) return { error: "Exam not found" };

  const updated = await prisma.exam.update({
    where: { id: examId },
    data: parsed.data,
  });

  revalidatePath(`/admin/exams/${examId}`);
  revalidatePath("/admin/exams");
  return { data: updated };
}

export async function deleteExam(examId: string) {
  const admin = await requireAdmin();

  const exam = await prisma.exam.findFirst({
    where: { id: examId, adminId: admin.id },
  });
  if (!exam) return { error: "Exam not found" };

  await prisma.exam.delete({ where: { id: examId } });

  revalidatePath("/admin/exams");
  return { success: true };
}

export async function togglePublishExam(examId: string) {
  const admin = await requireAdmin();

  const exam = await prisma.exam.findFirst({
    where: { id: examId, adminId: admin.id },
  });
  if (!exam) return { error: "Exam not found" };

  const updated = await prisma.exam.update({
    where: { id: examId },
    data: { isPublished: !exam.isPublished },
  });

  revalidatePath("/admin/exams");
  return { data: updated };
}

export async function duplicateExam(examId: string) {
  const admin = await requireAdmin();

  const exam = await prisma.exam.findFirst({
    where: { id: examId, adminId: admin.id },
    include: {
      sections: {
        include: { questions: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });
  if (!exam) return { error: "Exam not found" };

  const newExam = await prisma.exam.create({
    data: {
      adminId: admin.id,
      title: `${exam.title} (Copy)`,
      description: exam.description,
      durationMinutes: exam.durationMinutes,
      passingPercentage: exam.passingPercentage,
      shuffleQuestions: exam.shuffleQuestions,
      allowNegativeMarking: exam.allowNegativeMarking,
      negativeMarkValue: exam.negativeMarkValue,
      accessLink: nanoid(12),
      sections: {
        create: exam.sections.map((section) => ({
          title: section.title,
          description: section.description,
          orderIndex: section.orderIndex,
          questions: {
            create: section.questions.map((q) => ({
              questionText: q.questionText,
              questionType: q.questionType,
              options: q.options ?? undefined,
              correctAnswer: q.correctAnswer,
              marks: q.marks,
              explanation: q.explanation,
              imageUrl: q.imageUrl,
              orderIndex: q.orderIndex,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/admin/exams");
  return { data: newExam };
}
