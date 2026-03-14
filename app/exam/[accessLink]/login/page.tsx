"use client";

import { useTransition, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList } from "lucide-react";
import Image from "next/image";

import {
  candidateSignInSchema,
  type CandidateSignInInput,
} from "@/lib/validations/auth";

import { signInCandidate, startExam } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function CandidateLoginPage() {
  const params = useParams<{ accessLink: string }>();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CandidateSignInInput>({
    resolver: zodResolver(candidateSignInSchema),
    defaultValues: {
      email: "",
      password: "",
      accessLink: params.accessLink ?? "",
    },
  });

  function onSubmit(values: CandidateSignInInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await signInCandidate(values);

      if ("error" in result) {
        setServerError(result.error ?? "An unexpected error occurred");
        return;
      }

      const { data } = result;

      if (data.hasExistingAttempt && data.attemptId) {
        router.push(`/exam/${params.accessLink}/attempt/${data.attemptId}`);
        return;
      }

      const startResult = await startExam(data.examId, data.candidateId);

      if ("error" in startResult) {
        setServerError(startResult.error ?? "Failed to start exam");
        return;
      }

      router.push(`/exam/${params.accessLink}/attempt/${startResult.data.attemptId}`);
    });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto flex items-center gap-2.5 px-6 h-14">
          <Image src="/GC LOGO.svg" alt="Exam Portal Logo" width={32} height={32} quality={100} className="object-contain" />
          <span className="font-semibold tracking-tight">Exam Portal</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Candidate Login</h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to start the assessment
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serverError && (
                <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {serverError}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                {isPending ? "Starting assessment..." : "Start Assessment"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-xs text-muted-foreground">
            Access code: <code className="font-mono text-foreground">{params.accessLink}</code>
          </p>
        </div>
      </main>
    </div>
  );
}
