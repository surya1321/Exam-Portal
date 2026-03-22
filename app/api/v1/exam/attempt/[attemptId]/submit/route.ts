import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedCandidateSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { computeAndSubmitAttempt } from "@/lib/exam-engine";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;

  const session = await getVerifiedCandidateSession(attemptId);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = rateLimit(`submit:${attemptId}`, 5);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

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

  const examWindow = await prisma.exam.findUnique({
    where: { id: attempt.examId },
    select: { expiresAt: true },
  });
  if (examWindow?.expiresAt && new Date() > examWindow.expiresAt) {
    await computeAndSubmitAttempt(attemptId);
    return NextResponse.json(
      { error: "Exam window has expired", status: "expired" },
      { status: 410 }
    );
  }

  try {
    const result = await computeAndSubmitAttempt(attemptId);
    return NextResponse.json({
      status: "completed",
      totalScore: Number(result?.totalScore ?? 0),
      totalCorrect: result?.totalCorrect ?? 0,
      totalWrong: result?.totalWrong ?? 0,
      totalUnanswered: result?.totalUnanswered ?? 0,
    });
  } catch (err: unknown) {
    console.error("[submit/route] Unhandled error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
