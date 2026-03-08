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
import { Separator } from "@/components/ui/separator";

import { SectionManager } from "./sections/section-manager";

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

  // Serialize data for client component
  const sectionsData = exam.sections.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    orderIndex: section.orderIndex,
    questions: section.questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType as "mcq" | "true_false" | "fill_blank",
      options: q.options as { id: string; text: string }[] | null,
      correctAnswer: q.correctAnswer,
      marks: Number(q.marks),
      explanation: q.explanation,
      imageUrl: q.imageUrl,
      orderIndex: q.orderIndex,
    })),
  }));

  return (
    <div className="p-6 lg:p-8">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/admin/exams">
          <ArrowLeft className="h-4 w-4" />
          Back to Exams
        </Link>
      </Button>

      {/* Exam header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{exam.title}</h1>
            <Badge
              variant={exam.isPublished ? "default" : "secondary"}
              className={
                exam.isPublished
                  ? "bg-green-600 text-white hover:bg-green-600/90"
                  : ""
              }
            >
              {exam.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
          {exam.description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {exam.description}
            </p>
          )}
        </div>
        <Button variant="outline" asChild>
          <Link href={`/admin/exams/${examId}`}>Edit Exam</Link>
        </Button>
      </div>

      {/* Metadata cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="text-muted-foreground h-5 w-5 shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs">Duration</p>
              <p className="text-sm font-semibold">
                {exam.durationMinutes} min
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Award className="text-muted-foreground h-5 w-5 shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs">Total Marks</p>
              <p className="text-sm font-semibold">{exam.totalMarks}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Percent className="text-muted-foreground h-5 w-5 shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs">Passing %</p>
              <p className="text-sm font-semibold">
                {Number(exam.passingPercentage)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="text-muted-foreground h-5 w-5 shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs">Candidates</p>
              <p className="text-sm font-semibold">{exam._count.candidates}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <LinkIcon className="text-muted-foreground h-5 w-5 shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs">Access Link</p>
              <p className="truncate text-sm font-semibold">
                {exam.accessLink}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="mb-8" />

      {/* Section manager */}
      <SectionManager examId={examId} sections={sectionsData} />
    </div>
  );
}
