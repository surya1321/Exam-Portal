import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { examId } = await params;

    const exam = await prisma.exam.findFirst({
      where: { id: examId, adminId: admin.id },
    });
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const attempts = await prisma.examAttempt.findMany({
      where: { examId },
      include: { candidate: true },
      orderBy: { totalScore: "desc" },
    });

    const headers =
      "Rank,Name,Email,Score,Total Marks,Percentage,Status,Attempt Status,Submitted At\n";

    const rows = attempts
      .map((a, i) => {
        const score = Number(a.totalScore);
        const totalMarks = exam.totalMarks || 1;
        const pct = ((score / totalMarks) * 100).toFixed(2);
        const status =
          Number(pct) >= Number(exam.passingPercentage) ? "Pass" : "Fail";
        const submitted = a.submittedAt
          ? new Date(a.submittedAt).toISOString()
          : "In Progress";
        // Escape fields that might contain commas or quotes
        const name = `"${a.candidate.fullName.replace(/"/g, '""')}"`;
        const email = `"${(a.candidate.email ?? "").replace(/"/g, '""')}"`;
        return `${i + 1},${name},${email},${score},${totalMarks},${pct}%,${status},${a.status},${submitted}`;
      })
      .join("\n");

    const safeTitle = exam.title.replace(/[^a-zA-Z0-9]/g, "-");

    return new NextResponse(headers + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="results-${safeTitle}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
