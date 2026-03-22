"use server";

import { prisma } from "@/lib/prisma";
import { signSessionCookie, verifySessionCookie } from "@/lib/session";
import { candidateSignInSchema } from "@/lib/validations/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function signInCandidate(input: unknown) {
  const parsed = candidateSignInSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Find the exam by access link
  const exam = await prisma.exam.findUnique({
    where: { accessLink: parsed.data.accessLink },
  });
  if (!exam || !exam.isPublished) return { error: "Exam not found or not available" };

  // Check exam time window
  const now = new Date();
  if (exam.startsAt && now < exam.startsAt) return { error: "Exam has not started yet" };
  if (exam.expiresAt && now > exam.expiresAt) return { error: "Exam has expired" };

  // Find candidate by email
  const candidate = await prisma.candidate.findUnique({
    where: { examId_email: { examId: exam.id, email: parsed.data.email } },
  });
  if (!candidate) return { error: "Invalid credentials" };

  // Verify password
  const validPassword = await bcrypt.compare(parsed.data.password, candidate.passwordHash);
  if (!validPassword) return { error: "Invalid credentials" };

  // Check if already attempted and completed
  const existingAttempt = await prisma.examAttempt.findUnique({
    where: { candidateId_examId: { candidateId: candidate.id, examId: exam.id } },
  });
  if (existingAttempt && existingAttempt.status !== "in_progress") {
    return { error: "You have already completed this exam" };
  }

  const maxAge = (exam.durationMinutes + 30) * 60;

  const cookieStore = await cookies();
  cookieStore.set("candidate_session", signSessionCookie({
    candidateId: candidate.id,
    examId: exam.id,
    attemptId: existingAttempt?.id || null,
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  return {
    data: {
      candidateId: candidate.id,
      examId: exam.id,
      attemptId: existingAttempt?.id || null,
      hasExistingAttempt: !!existingAttempt,
    },
  };
}

export async function startExam() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("candidate_session")?.value;
  if (!raw) return { error: "Unauthorized" };

  const session = verifySessionCookie(raw);
  if (!session) return { error: "Invalid session" };

  const { candidateId, examId } = session;

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          questions: { orderBy: { orderIndex: "asc" }, take: 1 },
        },
      },
    },
  });
  if (!exam) return { error: "Exam not found" };

  const firstQuestion = exam.sections[0]?.questions[0];
  if (!firstQuestion) return { error: "Exam has no questions" };

  // Check for existing attempt
  const existing = await prisma.examAttempt.findUnique({
    where: { candidateId_examId: { candidateId, examId } },
  });
  if (existing) {
    if (existing.status !== "in_progress") {
      return { error: "You have already completed this exam" };
    }
    return { data: { attemptId: existing.id } };
  }

  const attempt = await prisma.examAttempt.create({
    data: {
      candidateId,
      examId,
      startedAt: new Date(),
      currentQuestionId: firstQuestion.id,
      status: "in_progress",
    },
  });

  // Mark candidate credentials as used
  await prisma.candidate.update({
    where: { id: candidateId },
    data: { isUsed: true },
  });

  const maxAge = (exam.durationMinutes + 30) * 60;

  cookieStore.set("candidate_session", signSessionCookie({
    candidateId,
    examId,
    attemptId: attempt.id,
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  return { data: { attemptId: attempt.id } };
}

export async function getCandidateSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("candidate_session")?.value;
  if (!raw) return null;
  return verifySessionCookie(raw);
}
