"use client";

import { useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { z } from "zod";
import { createQuestionSchema } from "@/lib/validations/question";
import { createQuestion, updateQuestion } from "./actions";

// Use z.input for the form type so it matches zodResolver's expectation
// (marks is optional in input due to .default(1), but required in output)
type QuestionFormValues = z.input<typeof createQuestionSchema>;

export type QuestionData = {
  id: string;
  questionText: string;
  questionType: "mcq" | "true_false" | "fill_blank";
  options: { id: string; text: string }[] | null;
  correctAnswer: string;
  marks: number;
  explanation: string | null;
  imageUrl: string | null;
  orderIndex: number;
};

type QuestionFormProps = {
  examId: string;
  sectionId: string;
  question?: QuestionData;
  nextOrderIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const defaultOptions = [
  { id: "A", text: "" },
  { id: "B", text: "" },
  { id: "C", text: "" },
  { id: "D", text: "" },
];

export function QuestionForm({
  examId,
  sectionId,
  question,
  nextOrderIndex,
  open,
  onOpenChange,
}: QuestionFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!question;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: question
      ? {
          questionText: question.questionText,
          questionType: question.questionType,
          options: question.options ?? defaultOptions,
          correctAnswer: question.correctAnswer,
          marks: question.marks,
          explanation: question.explanation ?? "",
          orderIndex: question.orderIndex,
        }
      : {
          questionText: "",
          questionType: "mcq",
          options: defaultOptions,
          correctAnswer: "",
          marks: 1,
          explanation: "",
          orderIndex: nextOrderIndex,
        },
  });

  const { fields } = useFieldArray({
    control,
    name: "options",
  });

  const questionType = watch("questionType");
  const correctAnswer = watch("correctAnswer");
  const options = watch("options");

  function onSubmit(data: QuestionFormValues) {
    // Clean up data based on question type
    const cleanedData = { ...data };

    if (data.questionType !== "mcq") {
      cleanedData.options = undefined;
    }

    if (data.questionType === "true_false") {
      // correctAnswer should be "True" or "False"
    }

    startTransition(async () => {
      if (isEditing && question) {
        const result = await updateQuestion(examId, question.id, cleanedData);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Question updated successfully");
          onOpenChange(false);
        }
      } else {
        const result = await createQuestion(examId, sectionId, cleanedData);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Question created successfully");
          reset();
          onOpenChange(false);
        }
      }
    });
  }

  function handleTypeChange(value: string) {
    const newType = value as "mcq" | "true_false" | "fill_blank";
    setValue("questionType", newType);
    setValue("correctAnswer", "");

    if (newType === "mcq") {
      setValue("options", defaultOptions);
    } else {
      setValue("options", undefined as unknown as { id: string; text: string }[]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Question" : "Add Question"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the question details below."
              : "Fill in the details to add a new question."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          {/* Question Type */}
          <div className="grid gap-2">
            <Label>Question Type</Label>
            <Select
              value={questionType}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                <SelectItem value="true_false">True / False</SelectItem>
                <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Question Text */}
          <div className="grid gap-2">
            <Label htmlFor="questionText">Question Text</Label>
            <Textarea
              id="questionText"
              placeholder="Enter your question here..."
              rows={3}
              {...register("questionText")}
              aria-invalid={!!errors.questionText}
            />
            {errors.questionText && (
              <p className="text-destructive text-sm">
                {errors.questionText.message}
              </p>
            )}
          </div>

          {/* Conditional fields based on question type */}
          {questionType === "mcq" && (
            <>
              {/* MCQ Options */}
              <div className="grid gap-3">
                <Label>Options</Label>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <span className="text-muted-foreground w-6 text-sm font-medium">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <Input
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      {...register(`options.${index}.text`)}
                      aria-invalid={!!errors.options?.[index]?.text}
                    />
                    <input
                      type="hidden"
                      {...register(`options.${index}.id`)}
                    />
                  </div>
                ))}
                {errors.options && (
                  <p className="text-destructive text-sm">
                    Please fill in all option texts.
                  </p>
                )}
              </div>

              {/* Correct Answer for MCQ */}
              <div className="grid gap-2">
                <Label>Correct Answer</Label>
                <Select
                  value={correctAnswer}
                  onValueChange={(value) => setValue("correctAnswer", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {(options ?? defaultOptions).map((opt, idx) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {String.fromCharCode(65 + idx)}.{" "}
                        {opt.text || `Option ${String.fromCharCode(65 + idx)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.correctAnswer && (
                  <p className="text-destructive text-sm">
                    {errors.correctAnswer.message}
                  </p>
                )}
              </div>
            </>
          )}

          {questionType === "true_false" && (
            <div className="grid gap-2">
              <Label>Correct Answer</Label>
              <RadioGroup
                value={correctAnswer}
                onValueChange={(value) => setValue("correctAnswer", value)}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="True" id="true-option" />
                  <Label htmlFor="true-option" className="cursor-pointer">
                    True
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="False" id="false-option" />
                  <Label htmlFor="false-option" className="cursor-pointer">
                    False
                  </Label>
                </div>
              </RadioGroup>
              {errors.correctAnswer && (
                <p className="text-destructive text-sm">
                  {errors.correctAnswer.message}
                </p>
              )}
            </div>
          )}

          {questionType === "fill_blank" && (
            <div className="grid gap-2">
              <Label htmlFor="correctAnswer">Correct Answer</Label>
              <Input
                id="correctAnswer"
                placeholder="Enter the correct answer"
                {...register("correctAnswer")}
                aria-invalid={!!errors.correctAnswer}
              />
              {errors.correctAnswer && (
                <p className="text-destructive text-sm">
                  {errors.correctAnswer.message}
                </p>
              )}
            </div>
          )}

          {/* Marks */}
          <div className="grid gap-2">
            <Label htmlFor="marks">Marks</Label>
            <Input
              id="marks"
              type="number"
              min={0}
              step={0.5}
              {...register("marks", { valueAsNumber: true })}
              aria-invalid={!!errors.marks}
            />
            {errors.marks && (
              <p className="text-destructive text-sm">
                {errors.marks.message}
              </p>
            )}
          </div>

          {/* Explanation */}
          <div className="grid gap-2">
            <Label htmlFor="explanation">
              Explanation{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="explanation"
              placeholder="Explain the correct answer..."
              rows={2}
              {...register("explanation")}
            />
          </div>

          {/* Hidden order index */}
          <input type="hidden" {...register("orderIndex", { valueAsNumber: true })} />

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
                  ? "Update Question"
                  : "Add Question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
