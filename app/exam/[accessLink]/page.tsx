import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ClipboardList, ArrowRight, Clock, Shield } from "lucide-react";

export default async function ExamInfoPage({
  params,
}: {
  params: Promise<{ accessLink: string }>;
}) {
  const { accessLink } = await params;

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
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <ClipboardList className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Online Assessment
            </h1>
            <p className="text-sm text-muted-foreground">
              You have been invited to take an assessment. Please log in with your
              credentials to begin.
            </p>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border bg-card p-4 text-center">
              <Shield className="h-4 w-4 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs font-medium text-muted-foreground">Secure</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Proctored exam</p>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <Clock className="h-4 w-4 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs font-medium text-muted-foreground">Timed</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Auto-submit on expiry</p>
            </div>
          </div>

          <div className="space-y-3">
            <Link href={`/exam/${accessLink}/login`} className="block">
              <Button className="w-full" size="lg">
                Continue to Login
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="text-center text-xs text-muted-foreground">
              Access code: <code className="font-mono text-foreground">{accessLink}</code>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
