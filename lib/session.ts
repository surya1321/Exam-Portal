import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_SECRET =
  process.env.CANDIDATE_SESSION_SECRET ||
  "dev-only-exam-secret-change-in-production";

export type CandidateSession = {
  candidateId: string;
  examId: string;
  attemptId: string | null;
};

export function signSessionCookie(payload: CandidateSession): string {
  const json = JSON.stringify(payload);
  const encoded = Buffer.from(json).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifySessionCookie(
  cookieValue: string
): CandidateSession | null {
  if (cookieValue.includes(".")) {
    const parts = cookieValue.split(".");
    if (parts.length !== 2) return null;
    const [encoded, signature] = parts;
    const expected = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(encoded)
      .digest("base64url");
    if (
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      return null;
    try {
      return JSON.parse(
        Buffer.from(encoded, "base64url").toString()
      ) as CandidateSession;
    } catch {
      return null;
    }
  }
  try {
    return JSON.parse(cookieValue) as CandidateSession;
  } catch {
    return null;
  }
}

/** Parse and verify the candidate session cookie against a specific attemptId. */
export async function getVerifiedCandidateSession(
  attemptId: string
): Promise<CandidateSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("candidate_session")?.value;
  if (!raw) return null;
  const session = verifySessionCookie(raw);
  if (!session || session.attemptId !== attemptId) return null;
  return session;
}

/** Parse the candidate session cookie without verifying attemptId. */
export async function getCandidateSession(): Promise<CandidateSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("candidate_session")?.value;
  if (!raw) return null;
  return verifySessionCookie(raw);
}
