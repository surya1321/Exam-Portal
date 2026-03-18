"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExamError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
      <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
      <p className="text-muted-foreground text-center max-w-md text-sm">
        An error occurred while loading the exam. Please try again.
        {error.digest && (
          <span className="block font-mono text-xs mt-1">({error.digest})</span>
        )}
      </p>
      <Button onClick={reset} variant="outline">Try again</Button>
    </div>
  );
}
