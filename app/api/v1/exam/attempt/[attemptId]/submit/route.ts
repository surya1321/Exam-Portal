import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeAndSubmitAttempt } from "@/lib/exam-engine";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;

  // Select only the field needed for validation
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    select: { status: true },
  });
  if (!attempt || attempt.status !== "in_progress") {
    return NextResponse.json(
      { error: "Invalid or completed attempt" },
      { status: 403 }
    );
  }

  const result = await computeAndSubmitAttempt(attemptId);

  return NextResponse.json({
    status: "completed",
    totalScore: Number(result?.totalScore),
    totalCorrect: result?.totalCorrect,
    totalWrong: result?.totalWrong,
    totalUnanswered: result?.totalUnanswered,
  });
}
