"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell, Legend, Tooltip } from "recharts"
import { ChartContainer } from "@/components/ui/chart"

// Bright multi-color palette for bar chart
const BAR_COLORS = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#3b82f6", // blue
  "#a855f7", // purple
  "#f97316", // orange
]

// Status → vivid color mapping for pie chart
const STATUS_COLORS: Record<string, string> = {
  Completed:   "#10b981", // emerald
  "In Progress": "#3b82f6", // blue
  Other:       "#f59e0b", // amber
  Timed_Out:   "#ef4444", // red
  "No Data":   "#94a3b8", // slate
}

const chartConfig = {
  attempts: { label: "Attempts", color: "#6366f1" },
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
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                formatter={(value, name) => [value, "Attempts"]}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="attempts" radius={[6, 6, 0, 0]}>
                {attemptsByDay.map((_, index) => (
                  <Cell key={`bar-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Overall Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-[200px] sm:min-h-[300px] w-full flex justify-center">
            <PieChart>
              <Pie
                data={statusDistribution}
                dataKey="value"
                nameKey="status"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={3}
                strokeWidth={2}
                stroke="hsl(var(--background))"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[entry.status] ?? BAR_COLORS[index % BAR_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [value, name]}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend
                iconType="circle"
                iconSize={10}
                formatter={(value) => (
                  <span style={{ fontSize: "12px", color: "hsl(var(--foreground))" }}>{value}</span>
                )}
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
