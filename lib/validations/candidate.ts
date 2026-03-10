import { z } from "zod";

export const createCandidateSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required").max(200),
  email: z.string().email("Valid email is required"),
});

export const bulkCreateCandidatesSchema = z.object({
  candidates: z.array(createCandidateSchema).min(1, "At least one candidate required"),
});

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type BulkCreateCandidatesInput = z.infer<typeof bulkCreateCandidatesSchema>;
