"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AttemptError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
      <h2 className="text-xl font-bold text-foreground">Exam Error</h2>
      <p className="text-muted-foreground text-center max-w-md text-sm">
        An unexpected error occurred during the exam.
        {error.digest && (
          <span className="block font-mono text-xs mt-1">({error.digest})</span>
        )}
      </p>
      <Button onClick={reset} variant="outline">Retry</Button>
    </div>
  );
}
