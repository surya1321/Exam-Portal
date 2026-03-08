"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  createCandidateSchema,
  bulkCreateCandidatesSchema,
} from "@/lib/validations/candidate";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

async function verifyExamOwnership(examId: string) {
  const admin = await requireAdmin();
  const exam = await prisma.exam.findFirst({
    where: { id: examId, adminId: admin.id },
  });
  if (!exam) throw new Error("Exam not found");
  return exam;
}

export async function createCandidate(examId: string, input: unknown) {
  await verifyExamOwnership(examId);
  const parsed = createCandidateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  try {
    const candidate = await prisma.candidate.create({
      data: {
        examId,
        username: parsed.data.username,
        passwordHash,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
      },
    });

    revalidatePath(`/admin/exams/${examId}/candidates`);
    return {
      data: {
        id: candidate.id,
        username: candidate.username,
        rawPassword: parsed.data.password,
      },
    };
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return {
        error: "A candidate with this username already exists for this exam",
      };
    }
    return { error: "Failed to create candidate" };
  }
}

export async function bulkCreateCandidates(examId: string, input: unknown) {
  await verifyExamOwnership(examId);
  const parsed = bulkCreateCandidatesSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const results: { username: string; password: string; fullName: string }[] =
    [];

  for (const candidate of parsed.data.candidates) {
    const passwordHash = await bcrypt.hash(candidate.password, 10);
    try {
      await prisma.candidate.create({
        data: {
          examId,
          username: candidate.username,
          passwordHash,
          fullName: candidate.fullName,
          email: candidate.email,
        },
      });
      results.push({
        username: candidate.username,
        password: candidate.password,
        fullName: candidate.fullName,
      });
    } catch {
      // Skip duplicates
    }
  }

  revalidatePath(`/admin/exams/${examId}/candidates`);
  return { data: { created: results.length, candidates: results } };
}

export async function deleteCandidate(examId: string, candidateId: string) {
  await verifyExamOwnership(examId);
  await prisma.candidate.delete({ where: { id: candidateId } });
  revalidatePath(`/admin/exams/${examId}/candidates`);
  return { success: true };
}
