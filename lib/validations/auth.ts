import { z } from "zod";

export const adminSignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const adminSignUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const candidateSignInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  accessLink: z.string().min(1, "Exam access link is required"),
});

export type AdminSignInInput = z.infer<typeof adminSignInSchema>;
export type AdminSignUpInput = z.infer<typeof adminSignUpSchema>;
export type CandidateSignInInput = z.infer<typeof candidateSignInSchema>;
