"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  attempts: {
    label: "Attempts",
    color: "hsl(var(--primary))",
  },
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-1))",
  },
  in_progress: {
    label: "In Progress",
    color: "hsl(var(--chart-2))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-3))",
  },
}

export function DashboardCharts({ 
  attemptsByDay, 
  statusDistribution 
}: { 
  attemptsByDay: { date: string, attempts: number }[],
  statusDistribution: { status: string, value: number, fill: string }[]
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Attempts - Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <ChartContainer config={chartConfig} className="min-h-[200px] sm:min-h-[260px] w-full">
            <BarChart data={attemptsByDay} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", { weekday: "short" });
                }}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="attempts" fill="var(--color-attempts)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Overall Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-[200px] sm:min-h-[260px] w-full flex justify-center">
            <PieChart>
              <Pie
                data={statusDistribution}
                dataKey="value"
                nameKey="status"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
