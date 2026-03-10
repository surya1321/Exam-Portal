import { z } from "zod";

const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1, "Option text is required"),
});

// Base schema without refinement (needed for .partial() on update)
const baseQuestionSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  questionType: z.enum(["mcq", "true_false", "fill_blank", "essay"]),
  options: z.array(optionSchema).optional(),
  correctAnswer: z.string().optional().default(""),
  marks: z.number().min(0).default(1),
  explanation: z.string().optional(),
  imageUrl: z.string().url().optional(),
  orderIndex: z.number().int().min(0),
});

export const createQuestionSchema = baseQuestionSchema.refine(
  (data) => {
    // Essay questions don't need a correct answer
    if (data.questionType === "essay") return true;
    return data.correctAnswer && data.correctAnswer.length > 0;
  },
  {
    message: "Correct answer is required",
    path: ["correctAnswer"],
  }
);

export const updateQuestionSchema = baseQuestionSchema.partial();

export const reorderQuestionsSchema = z.object({
  questionIds: z.array(z.string().uuid()),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
