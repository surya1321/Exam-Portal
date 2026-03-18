import { NextResponse } from "next/server";
import { getVerifiedCandidateSession } from "@/lib/session";
import { getTimeRemaining } from "@/lib/exam-engine";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;

  const session = await getVerifiedCandidateSession(attemptId);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timeRemaining = await getTimeRemaining(attemptId);
  return NextResponse.json({ timeRemaining });
}
