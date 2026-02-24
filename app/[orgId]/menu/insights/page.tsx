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
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";
import { useCafeInsights } from "@/hooks/use-cafe";
import { formatPrice } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatChartDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function MenuInsightsPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const { data: insights, isLoading } = useCafeInsights(orgId);

  if (!orgId) return null;

  if (isLoading || !insights) {
    return (
      <div className="container mx-auto max-w-6xl p-4">
        <div className="mb-2">
          <h1 className="text-md font-semibold">Cafe Insights</h1>
          <p className="text-muted-foreground text-xs">
            Analytics and insights for your cafe.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[320px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[320px] w-full" />
            </CardContent>
          </Card>
        </div>
        <Card className="mt-6">
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[320px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const itemsByCategoryData = insights.itemsByCategory.map((c) => ({
    name: c.categoryName || "Uncategorized",
    count: c.count,
  }));

  const ordersOverTimeData = insights.ordersOverTime.map((d) => ({
    ...d,
    label: formatChartDate(d.date),
  }));

  const revenueOverTimeData = insights.revenueOverTime.map((d) => ({
    ...d,
    label: formatChartDate(d.date),
    revenue: (d.totalCents ?? 0) / 100,
  }));

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-2">
        <h1 className="text-md font-semibold">Cafe Insights</h1>
        <p className="text-muted-foreground text-xs">
          View sales trends, popular items by category, and performance metrics.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Menu items by category</CardTitle>
            <CardDescription>
              Number of menu items in each category.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {itemsByCategoryData.length === 0 ? (
              <p className="flex h-[320px] items-center justify-center text-muted-foreground text-sm">
                No menu items with categories yet.
              </p>
            ) : (
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={itemsByCategoryData}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 80, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={76}
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 12 }}
                      formatter={(value: number) => [value, "Items"]}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders over time (last 30 days)</CardTitle>
            <CardDescription>
              Daily order count.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ordersOverTimeData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value: number) => [value, "Orders"]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.date
                        ? formatChartDate(payload[0].payload.date)
                        : ""
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Revenue over time (last 30 days)</CardTitle>
          <CardDescription>
            Daily revenue in USD.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueOverTimeData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  formatter={(value: number) => [formatPrice(value), "Revenue"]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.date
                      ? formatChartDate(payload[0].payload.date)
                      : ""
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--chart-2))"
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
