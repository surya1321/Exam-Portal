"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Clock,
  HelpCircle,
  Users,
  MoreVertical,
  Pencil,
  Eye,
  EyeOff,
  Copy,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { deleteExam, togglePublishExam, duplicateExam } from "./actions";
import { CreateExamDialog } from "./create-exam-dialog";

export type ExamListItem = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  isPublished: boolean;
  createdAt: string;
  totalQuestions: number;
  sectionsCount: number;
  candidatesCount: number;
  attemptsCount: number;
};

interface ExamListClientProps {
  exams: ExamListItem[];
}

export function ExamListClient({ exams }: ExamListClientProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleTogglePublish(examId: string, currentlyPublished: boolean) {
    startTransition(async () => {
      const result = await togglePublishExam(examId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          currentlyPublished ? "Exam unpublished" : "Exam published"
        );
      }
    });
  }

  function handleDuplicate(examId: string) {
    startTransition(async () => {
      const result = await duplicateExam(examId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Exam duplicated successfully");
      }
    });
  }

  function handleDeleteConfirm() {
    if (!examToDelete) return;
    startTransition(async () => {
      const result = await deleteExam(examToDelete);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Exam deleted successfully");
      }
      setExamToDelete(null);
      setDeleteDialogOpen(false);
    });
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exams</h1>
          <p className="text-muted-foreground text-sm">
            Manage your examination papers
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Exam
        </Button>
      </div>

      {/* Empty state */}
      {exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FileText className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="mb-1 text-lg font-semibold">No exams yet</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Create your first exam to get started.
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Exam
          </Button>
        </div>
      ) : (
        /* Exam cards grid */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <Link key={exam.id} href={`/admin/exams/${exam.id}`}>
              <Card className="relative cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="pr-16">{exam.title}</CardTitle>
                  <CardAction>
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
                  </CardAction>
                  {exam.description && (
                    <CardDescription className="line-clamp-2">
                      {exam.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent>
                  <div className="text-muted-foreground flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {exam.durationMinutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="h-3.5 w-3.5" />
                      {exam.totalQuestions} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {exam.candidatesCount} candidates
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => e.preventDefault()}
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/exams/${exam.id}`}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleTogglePublish(exam.id, exam.isPublished)
                      }
                      disabled={isPending}
                    >
                      {exam.isPublished ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Publish
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDuplicate(exam.id)}
                      disabled={isPending}
                    >
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        setExamToDelete(exam.id);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create exam dialog */}
      <CreateExamDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this exam? This action cannot be
              undone. All sections, questions, and attempt data associated with
              this exam will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setExamToDelete(null);
                setDeleteDialogOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
