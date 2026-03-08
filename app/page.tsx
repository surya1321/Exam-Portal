"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { GraduationCap, ShieldCheck, ArrowRight } from "lucide-react";

export default function Home() {
  const [accessLink, setAccessLink] = useState("");
  const router = useRouter();

  const handleGoToExam = () => {
    const trimmed = accessLink.trim();
    if (!trimmed) return;
    // Support both full URLs and just the access code
    const code = trimmed.includes("/exam/")
      ? trimmed.split("/exam/").pop()?.split("/")[0] ?? trimmed
      : trimmed;
    router.push(`/exam/${code}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-lg space-y-8 text-center">
        {/* Logo & Title */}
        <div className="space-y-3">
          <div className="flex items-center justify-center">
            <GraduationCap className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Exam Portal</h1>
          <p className="text-muted-foreground text-lg">
            Secure online examination platform
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid gap-6">
          {/* Admin Dashboard */}
          <Link
            href="/admin/dashboard"
            className="group flex items-center gap-4 rounded-xl border bg-card p-6 text-left shadow-sm transition-all hover:shadow-md hover:border-primary/50"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Admin Dashboard</h2>
              <p className="text-sm text-muted-foreground">
                Manage exams, questions, and view results
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Take an Exam */}
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-4 text-left">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Take an Exam</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your exam access link to get started
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Paste your access link or code..."
                value={accessLink}
                onChange={(e) => setAccessLink(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGoToExam()}
                className="flex-1"
              />
              <Button onClick={handleGoToExam} disabled={!accessLink.trim()}>
                Go
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
