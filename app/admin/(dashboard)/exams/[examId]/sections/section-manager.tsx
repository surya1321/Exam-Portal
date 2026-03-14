"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  createSection,
  updateSection,
  deleteSection,
  deleteQuestion,
} from "./actions";
import { QuestionForm, type QuestionData } from "./question-form";

type SectionData = {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  questions: QuestionData[];
};

type SectionManagerProps = {
  examId: string;
  sections: SectionData[];
};

// --- Section Form Dialog ---

function SectionFormDialog({
  examId,
  section,
  nextOrderIndex,
  open,
  onOpenChange,
}: {
  examId: string;
  section?: SectionData;
  nextOrderIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!section;

  const [title, setTitle] = useState(section?.title ?? "");
  const [description, setDescription] = useState(section?.description ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Section title is required");
      return;
    }

    startTransition(async () => {
      if (isEditing && section) {
        const result = await updateSection(examId, section.id, {
          title: title.trim(),
          description: description.trim() || undefined,
        });
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Section updated successfully");
          onOpenChange(false);
        }
      } else {
        const result = await createSection(examId, {
          title: title.trim(),
          description: description.trim() || undefined,
          orderIndex: nextOrderIndex,
        });
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Section created successfully");
          setTitle("");
          setDescription("");
          onOpenChange(false);
        }
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Section" : "Add Section"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the section details below."
              : "Enter a title and optional description for the new section."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="section-title">Title</Label>
            <Input
              id="section-title"
              placeholder="e.g. Section A — Algebra"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="section-description">
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="section-description"
              placeholder="Instructions for this section..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                  ? "Update Section"
                  : "Add Section"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Question Type Badge ---

function QuestionTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    mcq: "MCQ",
    true_false: "True/False",
    fill_blank: "Fill Blank",
  };

  const variants: Record<string, "default" | "secondary" | "outline"> = {
    mcq: "default",
    true_false: "secondary",
    fill_blank: "outline",
  };

  return <Badge variant={variants[type] ?? "secondary"}>{labels[type] ?? type}</Badge>;
}

// --- Main Section Manager ---

export function SectionManager({ examId, sections }: SectionManagerProps) {
  const [isPending, startTransition] = useTransition();

  // Section dialog state
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionData | undefined>(
    undefined
  );

  // Question dialog state
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<
    QuestionData | undefined
  >(undefined);
  const [activeSectionId, setActiveSectionId] = useState<string>("");

  // Delete confirmation state
  const [deleteSectionDialog, setDeleteSectionDialog] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  const [deleteQuestionDialog, setDeleteQuestionDialog] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  // --- Section handlers ---

  function handleAddSection() {
    setEditingSection(undefined);
    setSectionDialogOpen(true);
  }

  function handleEditSection(section: SectionData) {
    setEditingSection(section);
    setSectionDialogOpen(true);
  }

  function handleConfirmDeleteSection() {
    if (!sectionToDelete) return;
    startTransition(async () => {
      const result = await deleteSection(examId, sectionToDelete);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Section deleted successfully");
      }
      setSectionToDelete(null);
      setDeleteSectionDialog(false);
    });
  }

  // --- Question handlers ---

  function handleAddQuestion(sectionId: string) {
    setActiveSectionId(sectionId);
    setEditingQuestion(undefined);
    setQuestionDialogOpen(true);
  }

  function handleEditQuestion(sectionId: string, question: QuestionData) {
    setActiveSectionId(sectionId);
    setEditingQuestion(question);
    setQuestionDialogOpen(true);
  }

  function handleConfirmDeleteQuestion() {
    if (!questionToDelete) return;
    startTransition(async () => {
      const result = await deleteQuestion(examId, questionToDelete);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Question deleted successfully");
      }
      setQuestionToDelete(null);
      setDeleteQuestionDialog(false);
    });
  }

  // Compute next order index for question in the active section
  const activeSection = sections.find((s) => s.id === activeSectionId);
  const nextQuestionOrderIndex = activeSection
    ? activeSection.questions.length
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sections & Questions</h2>
        <Button onClick={handleAddSection} size="sm">
          <Plus className="h-4 w-4" />
          Add Section
        </Button>
      </div>

      {/* Empty state */}
      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-muted-foreground mb-3 text-sm">
            No sections yet. Add a section to start building your exam.
          </p>
          <Button onClick={handleAddSection} variant="outline" size="sm">
            <Plus className="h-4 w-4" />
            Add Section
          </Button>
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={sections.map((s) => s.id)}>
          {sections.map((section) => (
            <AccordionItem key={section.id} value={section.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <span>{section.title}</span>
                  <Badge variant="secondary">
                    {section.questions.length}{" "}
                    {section.questions.length === 1 ? "question" : "questions"}
                  </Badge>
                </div>
              </AccordionTrigger>

              <AccordionContent>
                {/* Section description */}
                {section.description && (
                  <p className="text-muted-foreground mb-3 text-sm">
                    {section.description}
                  </p>
                )}

                {/* Section actions */}
                <div className="mb-4 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSection(section)}
                    disabled={isPending}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Section
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setSectionToDelete(section.id);
                      setDeleteSectionDialog(true);
                    }}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Section
                  </Button>
                  <div className="flex-1" />
                  <Button
                    size="sm"
                    onClick={() => handleAddQuestion(section.id)}
                    disabled={isPending}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Question
                  </Button>
                </div>

                {/* Questions table */}
                {section.questions.length === 0 ? (
                  <div className="text-muted-foreground rounded-md border border-dashed py-6 text-center text-sm">
                    No questions in this section yet.
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Question Text</TableHead>
                          <TableHead className="w-28">Type</TableHead>
                          <TableHead className="w-20 text-right">
                            Marks
                          </TableHead>
                          <TableHead className="w-28 text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.questions.map((question, qIdx) => (
                          <TableRow key={question.id}>
                            <TableCell className="text-muted-foreground font-mono">
                              {qIdx + 1}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {question.questionText}
                            </TableCell>
                            <TableCell>
                              <QuestionTypeBadge type={question.questionType} />
                            </TableCell>
                            <TableCell className="text-right">
                              {question.marks}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() =>
                                    handleEditQuestion(section.id, question)
                                  }
                                  disabled={isPending}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setQuestionToDelete(question.id);
                                    setDeleteQuestionDialog(true);
                                  }}
                                  disabled={isPending}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Section form dialog */}
      <SectionFormDialog
        examId={examId}
        section={editingSection}
        nextOrderIndex={sections.length}
        open={sectionDialogOpen}
        onOpenChange={(open) => {
          setSectionDialogOpen(open);
          if (!open) setEditingSection(undefined);
        }}
      />

      {/* Question form dialog */}
      <QuestionForm
        examId={examId}
        sectionId={activeSectionId}
        question={editingQuestion}
        nextOrderIndex={nextQuestionOrderIndex}
        open={questionDialogOpen}
        onOpenChange={setQuestionDialogOpen}
      />

      {/* Delete section confirmation */}
      <AlertDialog
        open={deleteSectionDialog}
        onOpenChange={setDeleteSectionDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this section? All questions within
              this section will be permanently removed. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSectionToDelete(null);
                setDeleteSectionDialog(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDeleteSection}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete question confirmation */}
      <AlertDialog
        open={deleteQuestionDialog}
        onOpenChange={setDeleteQuestionDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setQuestionToDelete(null);
                setDeleteQuestionDialog(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDeleteQuestion}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
