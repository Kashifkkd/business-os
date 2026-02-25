"use client";

import { useParams } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useLeadsStats } from "@/hooks/use-leads";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";

function formatChartDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function LeadsInsightsPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const { data: stats, isLoading } = useLeadsStats(orgId);

  if (!orgId) return null;

  if (isLoading || !stats) {
    return (
      <div className="container mx-auto max-w-6xl p-4">
        <div className="mb-4">
          <h1 className="text-lg font-semibold">Leads Insights</h1>
          <p className="text-muted-foreground text-sm">Analytics and conversion metrics.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card><CardHeader><Skeleton className="h-8 w-24" /></CardHeader><CardContent><Skeleton className="h-6 w-16" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-8 w-24" /></CardHeader><CardContent><Skeleton className="h-6 w-16" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-8 w-24" /></CardHeader><CardContent><Skeleton className="h-6 w-16" /></CardContent></Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card><CardHeader><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-72" /></CardHeader><CardContent><Skeleton className="h-[320px] w-full" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-72" /></CardHeader><CardContent><Skeleton className="h-[320px] w-full" /></CardContent></Card>
        </div>
        <Card className="mt-6"><CardHeader><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-72" /></CardHeader><CardContent><Skeleton className="h-[320px] w-full" /></CardContent></Card>
      </div>
    );
  }

  const wonCount = stats.byStatus.find((s) => s.status === "won")?.count ?? 0;
  const conversionRate = stats.total > 0 ? Math.round((wonCount / stats.total) * 100) : 0;

  const byStatusData = stats.byStatus.map((s) => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    count: s.count,
  }));

  const bySourceData = stats.bySource.map((s) => ({
    name: s.source === "Unknown" ? "Unknown" : s.source.replace(/_/g, " "),
    count: s.count,
  }));

  const overTimeData = stats.overTime.map((d) => ({
    ...d,
    label: formatChartDate(d.date),
  }));

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="size-5" />
        <div>
          <h1 className="text-lg font-semibold">Leads Insights</h1>
          <p className="text-muted-foreground text-sm">
            Conversion funnel, sources, and leads over time.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">New this week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.newThisWeek}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion rate (won)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{conversionRate}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leads by status</CardTitle>
            <CardDescription>Count per pipeline stage.</CardDescription>
          </CardHeader>
          <CardContent>
            {byStatusData.length === 0 ? (
              <p className="flex h-[320px] items-center justify-center text-muted-foreground text-sm">
                No leads yet.
              </p>
            ) : (
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={byStatusData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(value: number | undefined) => [value ?? 0, "Leads"]} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads by source</CardTitle>
            <CardDescription>Where leads came from.</CardDescription>
          </CardHeader>
          <CardContent>
            {bySourceData.length === 0 ? (
              <p className="flex h-[320px] items-center justify-center text-muted-foreground text-sm">
                No leads yet.
              </p>
            ) : (
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={bySourceData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(value: number | undefined) => [value ?? 0, "Leads"]} />
                    <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Leads over time (last 30 days)</CardTitle>
          <CardDescription>Daily new leads.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overTimeData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  formatter={(value: number | undefined) => [value ?? 0, "Leads"]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.date ? formatChartDate(payload[0].payload.date) : ""
                  }
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
