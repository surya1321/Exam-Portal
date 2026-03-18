import { cookies } from "next/headers";

export type CandidateSession = {
  candidateId: string;
  examId: string;
  attemptId: string | null;
};

/** Parse and verify the candidate session cookie against a specific attemptId. */
export async function getVerifiedCandidateSession(
  attemptId: string
): Promise<CandidateSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("candidate_session")?.value;
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as CandidateSession;
    if (session.attemptId !== attemptId) return null;
    return session;
  } catch {
    return null;
  }
}

/** Parse the candidate session cookie without verifying attemptId. */
export async function getCandidateSession(): Promise<CandidateSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("candidate_session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CandidateSession;
  } catch {
    return null;
  }
}
