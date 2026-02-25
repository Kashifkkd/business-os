"use client";

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
} from "recharts";
import { useCafeDashboard } from "@/hooks/use-cafe";
import { formatPrice } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Shapes,
  ListTree,
  Tag,
  ShoppingBag,
  DollarSign,
} from "lucide-react";

function formatChartDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface CafeDashboardProps {
  orgId: string;
  /** When true, show "Dashboard" heading and description (e.g. on menu/dashboard). When false, minimal heading (e.g. on org home overview). */
  showHeading?: boolean;
  /** When true, use full width (no max-w container). Use on overview page. */
  fullWidth?: boolean;
}

const containerClass = (full: boolean) =>
  full ? "w-full min-w-0" : "container mx-auto max-w-6xl p-4";

export function CafeDashboard({ orgId, showHeading = true, fullWidth = false }: CafeDashboardProps) {
  const { data: stats, isLoading } = useCafeDashboard(orgId);

  if (!orgId) return null;

  if (isLoading || !stats) {
    return (
      <div className={containerClass(fullWidth)}>
        {showHeading && (
          <div className="mb-2">
            <h1 className="text-md font-semibold">Dashboard</h1>
            <p className="text-muted-foreground text-xs">
              Overview of orders, revenue, and activity.
            </p>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-7 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[260px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[260px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const ordersChartData = stats.ordersLast7Days.map((d) => ({
    ...d,
    label: formatChartDate(d.date),
  }));
  const revenueChartData = stats.revenueLast7Days.map((d) => ({
    ...d,
    label: formatChartDate(d.date),
    revenue: d.totalCents / 100,
  }));

  const statCards = [
    { label: "Menu Items", value: stats.menuItemsCount, icon: BookOpen },
    { label: "Categories", value: stats.categoriesCount, icon: Shapes },
    { label: "Sub-categories", value: stats.subcategoriesCount, icon: ListTree },
    { label: "Discounts", value: stats.discountsCount, icon: Tag },
    { label: "Orders", value: stats.ordersCount, icon: ShoppingBag },
    {
      label: "Revenue",
      value: formatPrice(stats.totalRevenueCents / 100),
      icon: DollarSign,
    },
  ];

  return (
    <div className={containerClass(fullWidth)}>
      {showHeading && (
        <div className="mb-2">
          <h1 className="text-md font-semibold">Dashboard</h1>
          <p className="text-muted-foreground text-xs">
            Overview of orders, revenue, and activity.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-semibold tabular-nums">
                {typeof value === "number" ? value : value}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders (last 7 days)</CardTitle>
            <CardDescription>Daily order count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ordersChartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    labelStyle={{ fontSize: 11 }}
                    formatter={(value: number | undefined) => [value ?? 0, "Orders"]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.date
                        ? formatChartDate(payload[0].payload.date)
                        : ""
                    }
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue (last 7 days)</CardTitle>
            <CardDescription>Daily revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueChartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    labelStyle={{ fontSize: 11 }}
                    formatter={(value: number | undefined) => [
                      formatPrice(value ?? 0),
                      "Revenue",
                    ]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.date
                        ? formatChartDate(payload[0].payload.date)
                        : ""
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {Object.keys(stats.ordersByStatus).length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
            <CardDescription>Current order status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="rounded-lg border bg-muted/30 px-4 py-2"
                >
                  <span className="text-muted-foreground text-xs capitalize">
                    {status}
                  </span>
                  <span className="ml-2 font-semibold tabular-nums">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
