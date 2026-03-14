import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, Activity, BarChart3 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardCharts } from "./components/dashboard-charts";

export default async function DashboardPage() {
  const admin = await requireAdmin();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [examCount, candidateCount, activeExams, recentAttempts, allAttempts] =
    await Promise.all([
      prisma.exam.count({ where: { adminId: admin.id } }),
      prisma.candidate.count({ where: { exam: { adminId: admin.id } } }),
      prisma.exam.count({
        where: { adminId: admin.id, isPublished: true },
      }),
      prisma.examAttempt.findMany({
        where: { exam: { adminId: admin.id } },
        take: 10,
        orderBy: { startedAt: "desc" },
        include: { candidate: true, exam: { select: { title: true } } },
      }),
      prisma.examAttempt.findMany({
        where: { exam: { adminId: admin.id } },
        select: { startedAt: true, status: true },
      }),
    ]);

  const stats = [
    { label: "Total Exams", value: examCount, icon: FileText, color: "text-primary" },
    { label: "Candidates", value: candidateCount, icon: Users, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Active Exams", value: activeExams, icon: Activity, color: "text-amber-600 dark:text-amber-400" },
    { label: "Total Attempts", value: allAttempts.length, icon: BarChart3, color: "text-violet-600 dark:text-violet-400" },
  ];

  // Prepare chart data
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  const recent7DaysAttempts = allAttempts.filter(a => a.startedAt >= sevenDaysAgo);

  const attemptsByDay = last7Days.map(date => {
    return {
      date,
      attempts: recent7DaysAttempts.filter(a => a.startedAt.toISOString().split("T")[0] === date).length
    }
  });

  const statusDistribution = [
    { status: "Completed", value: allAttempts.filter(a => a.status === 'completed').length, fill: "var(--color-completed)" },
    { status: "In Progress", value: allAttempts.filter(a => a.status === 'in_progress').length, fill: "var(--color-in_progress)" },
    { status: "Other", value: allAttempts.filter(a => ['timed_out', 'abandoned'].includes(a.status)).length, fill: "var(--color-other)" },
  ].filter(s => s.value > 0);
  
  if (statusDistribution.length === 0) {
    statusDistribution.push({ status: "No Data", value: 1, fill: "hsl(var(--muted))" });
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 lg:space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {admin.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your assessment platform.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <DashboardCharts attemptsByDay={attemptsByDay} statusDistribution={statusDistribution} />

      {/* Recent Activity */}
      {recentAttempts.length > 0 && (
        <Card className="mt-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0 divide-y">
              {recentAttempts.map((attempt) => {
                const statusColor =
                  attempt.status === "completed"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                    : attempt.status === "in_progress"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                      : attempt.status === "timed_out"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                        : "bg-muted text-muted-foreground";

                return (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {attempt.candidate.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {attempt.candidate.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {attempt.exam.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${statusColor}`}
                      >
                        {attempt.status.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {new Date(attempt.startedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
