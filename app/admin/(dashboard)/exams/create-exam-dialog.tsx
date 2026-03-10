"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";

import {
  createExamSchema,
  type CreateExamInput,
} from "@/lib/validations/exam";
import { createExam } from "./actions";

interface CreateExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateExamDialog({ open, onOpenChange }: CreateExamDialogProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateExamInput>({
    resolver: zodResolver(createExamSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      durationMinutes: 45,
      passingPercentage: 40,
      shuffleQuestions: false,
      allowNegativeMarking: false,
      negativeMarkValue: 0,
    },
  });

  const allowNegativeMarking = watch("allowNegativeMarking");
  const shuffleQuestions = watch("shuffleQuestions");

  function onSubmit(data: CreateExamInput) {
    startTransition(async () => {
      const result = await createExam(data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Exam created successfully");
        reset();
        onOpenChange(false);
        if (result.data?.id) {
          router.push(`/admin/exams/${result.data.id}`);
        }
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Exam</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new examination.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. Midterm Exam — Mathematics"
              {...register("title")}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-destructive text-sm">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description for this exam"
              {...register("description")}
            />
          </div>

          {/* Duration & Passing percentage — side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="durationMinutes">Duration (minutes)</Label>
              <Input
                id="durationMinutes"
                type="number"
                min={1}
                max={480}
                {...register("durationMinutes", { valueAsNumber: true })}
                aria-invalid={!!errors.durationMinutes}
              />
              {errors.durationMinutes && (
                <p className="text-destructive text-sm">
                  {errors.durationMinutes.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="passingPercentage">Passing %</Label>
              <Input
                id="passingPercentage"
                type="number"
                min={0}
                max={100}
                {...register("passingPercentage", { valueAsNumber: true })}
                aria-invalid={!!errors.passingPercentage}
              />
              {errors.passingPercentage && (
                <p className="text-destructive text-sm">
                  {errors.passingPercentage.message}
                </p>
              )}
            </div>
          </div>

          {/* Shuffle Questions */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="shuffleQuestions" className="cursor-pointer">
              Shuffle Questions
            </Label>
            <Switch
              id="shuffleQuestions"
              checked={shuffleQuestions}
              onCheckedChange={(checked) =>
                setValue("shuffleQuestions", checked === true)
              }
            />
          </div>

          {/* Negative Marking */}
          <div className="grid gap-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="allowNegativeMarking"
                className="cursor-pointer"
              >
                Allow Negative Marking
              </Label>
              <Switch
                id="allowNegativeMarking"
                checked={allowNegativeMarking}
                onCheckedChange={(checked) => {
                  setValue("allowNegativeMarking", checked === true);
                  if (!checked) {
                    setValue("negativeMarkValue", 0);
                  }
                }}
              />
            </div>
            {allowNegativeMarking && (
              <div className="grid gap-2">
                <Label htmlFor="negativeMarkValue">
                  Negative Mark Value
                </Label>
                <Input
                  id="negativeMarkValue"
                  type="number"
                  min={0}
                  max={100}
                  step={0.25}
                  {...register("negativeMarkValue", { valueAsNumber: true })}
                  aria-invalid={!!errors.negativeMarkValue}
                />
                {errors.negativeMarkValue && (
                  <p className="text-destructive text-sm">
                    {errors.negativeMarkValue.message}
                  </p>
                )}
              </div>
            )}
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
              {isPending ? "Creating..." : "Create Exam"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
