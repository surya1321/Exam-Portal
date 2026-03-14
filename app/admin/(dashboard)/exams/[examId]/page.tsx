import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Award,
  Percent,
  Users,
  LinkIcon,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { SectionManager } from "./sections/section-manager";
import { PublishButton } from "./publish-button";

type ExamDetailPageProps = {
  params: Promise<{ examId: string }>;
};

export default async function ExamDetailPage({ params }: ExamDetailPageProps) {
  const { examId } = await params;
  const admin = await requireAdmin();

  const exam = await prisma.exam.findFirst({
    where: { id: examId, adminId: admin.id },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          questions: { orderBy: { orderIndex: "asc" } },
        },
      },
      _count: { select: { candidates: true, attempts: true } },
    },
  });

  if (!exam) {
    notFound();
  }

  const sectionsData = exam.sections.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    orderIndex: section.orderIndex,
    questions: section.questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType as "mcq" | "true_false" | "fill_blank" | "essay",
      options: q.options as { id: string; text: string }[] | null,
      correctAnswer: q.correctAnswer,
      marks: Number(q.marks),
      explanation: q.explanation,
      imageUrl: q.imageUrl,
      orderIndex: q.orderIndex,
    })),
  }));

  const totalQuestions = sectionsData.reduce(
    (sum, s) => sum + s.questions.length,
    0
  );

  const metadata = [
    { label: "Duration", value: `${exam.durationMinutes} min`, icon: Clock },
    { label: "Total Marks", value: String(exam.totalMarks), icon: Award },
    { label: "Passing %", value: `${Number(exam.passingPercentage)}%`, icon: Percent },
    { label: "Candidates", value: String(exam._count.candidates), icon: Users },
    { label: "Access Link", value: exam.accessLink, icon: LinkIcon, truncate: true },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Exam header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{exam.title}</h1>
            <Badge
              variant={exam.isPublished ? "default" : "secondary"}
              className={
                exam.isPublished
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                  : ""
              }
            >
              {exam.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
          {exam.description && (
            <p className="text-sm text-muted-foreground max-w-2xl">
              {exam.description}
            </p>
          )}
        </div>
        <PublishButton examId={examId} isPublished={exam.isPublished} />
      </div>

      {/* Sub-navigation */}
      <nav className="flex items-center gap-1 border-b">
        <Link
          href={`/admin/exams/${examId}`}
          className="border-b-2 border-primary px-4 py-2.5 text-sm font-medium text-primary"
        >
          Overview
        </Link>
        <Link
          href={`/admin/exams/${examId}/candidates`}
          className="border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Candidates
        </Link>
        <Link
          href={`/admin/exams/${examId}/results`}
          className="border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Results
        </Link>
        <Link
          href={`/admin/exams/${examId}/analytics`}
          className="border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Analytics
        </Link>
      </nav>

      {/* Metadata cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {metadata.map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-sm font-semibold ${item.truncate ? "truncate" : ""}`}>
                  {item.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section manager */}
      <SectionManager examId={examId} sections={sectionsData} />
    </div>
  );
}
