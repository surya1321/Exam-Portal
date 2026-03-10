"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const [accessLink, setAccessLink] = useState("");
  const router = useRouter();

  const handleGoToExam = () => {
    const trimmed = accessLink.trim();
    if (!trimmed) return;
    const code = trimmed.includes("/exam/")
      ? trimmed.split("/exam/").pop()?.split("/")[0] ?? trimmed
      : trimmed;
    router.push(`/exam/${code}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-2.5">
            <Image src="/favicon.ico" alt="GCIA logo" width={32} height={32} className="rounded-lg" />
            <span className="font-semibold tracking-tight">GCIA Assessment Platform</span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard">Admin</Link>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto w-full px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left: Brand messaging */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3.5 py-1.5 text-xs font-medium text-primary">
                <ClipboardList className="h-3.5 w-3.5" />
                Assessment Platform
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
                Psychometric &<br />
                <span className="text-primary">Aptitude Testing</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                Create structured assessments, manage candidates, and gain actionable insights with detailed analytics.
              </p>
            </div>

            {/* Right: Action cards */}
            <div className="space-y-4">
              {/* Take an Exam */}
              <div className="rounded-xl border bg-card p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <ClipboardList className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Take an Assessment</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Enter your access code to begin
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
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
