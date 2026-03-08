import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Activity, BarChart3 } from "lucide-react";

const stats = [
  {
    title: "Total Exams",
    value: "0",
    icon: FileText,
    description: "Exams created",
  },
  {
    title: "Total Candidates",
    value: "0",
    icon: Users,
    description: "Registered candidates",
  },
  {
    title: "Active Exams",
    value: "0",
    icon: Activity,
    description: "Currently active",
  },
  {
    title: "Recent Attempts",
    value: "0",
    icon: BarChart3,
    description: "In the last 7 days",
  },
];

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Exam Portal admin dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
