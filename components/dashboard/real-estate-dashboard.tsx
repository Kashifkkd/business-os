"use client";

import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { useTenant } from "@/hooks/use-tenant";
import { useLeadsStats } from "@/hooks/use-leads";
import { useProperties } from "@/hooks/use-properties";
import { useListings } from "@/hooks/use-listings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Home,
  LayoutGrid,
  UserPlus,
  BarChart3,
  Tag,
  Megaphone,
  Workflow,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  new: "var(--chart-1)",
  contacted: "var(--chart-2)",
  qualified: "var(--chart-3)",
  proposal: "var(--chart-4)",
  won: "var(--chart-5)",
  lost: "var(--destructive)",
};

function formatChartDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type RealEstateDashboardProps = {
  orgId: string;
};

export function RealEstateDashboard({ orgId }: RealEstateDashboardProps) {
  const { tenant } = useTenant();
  const { data: leadsStats, isLoading: leadsLoading } = useLeadsStats(orgId);
  const { data: propertiesData } = useProperties(orgId, {
    page: 1,
    pageSize: 1,
  });
  const { data: listingsData } = useListings(orgId, {
    page: 1,
    pageSize: 1,
  });

  const propertiesTotal = propertiesData?.total ?? 0;
  const listingsTotal = listingsData?.total ?? 0;
  const leadsTotal = leadsStats?.total ?? 0;
  const newLeadsThisWeek = leadsStats?.newThisWeek ?? 0;

  const overTimeData =
    leadsStats?.overTime.map((d) => ({
      ...d,
      label: formatChartDate(d.date),
    })) ?? [];

  const byStatusData =
    leadsStats?.byStatus.map((s) => ({
      name: s.status.charAt(0).toUpperCase() + s.status.slice(1).replace(/_/g, " "),
      count: s.count,
      status: s.status,
    })) ?? [];

  const bySourceData = (leadsStats?.bySource ?? [])
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((s) => ({
      name: s.source === "Unknown" ? "Unknown" : s.source.replace(/_/g, " "),
      count: s.count,
    }));

  const base = tenant ? `/${tenant.id}` : "";
  const quickLinks = [
    { href: `${base}/leads`, label: "Leads", icon: UserPlus },
    { href: `${base}/leads/pipeline`, label: "Pipeline", icon: BarChart3 },
    { href: `${base}/properties`, label: "Properties", icon: Home },
    { href: `${base}/listings`, label: "Listings", icon: LayoutGrid },
    { href: `${base}/marketing`, label: "Marketing", icon: Megaphone },
    { href: `${base}/marketing/campaigns/new`, label: "New campaign", icon: Megaphone },
    { href: `${base}/marketing/journeys/new`, label: "Nurture sequence", icon: Workflow },
    { href: `${base}/marketing/analytics`, label: "Marketing analytics", icon: BarChart3 },
  ];

  const isLoading = leadsLoading;

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* Header + quick links in one row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold">{tenant?.name ?? "Overview"}</h1>
          <p className="text-muted-foreground text-xs">Properties, listings & leads</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-1.5 rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs font-medium hover:bg-muted/60"
            >
              <Icon className="size-3.5" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* KPIs: compact strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-1 h-6 w-10" />
            </Card>
          ))
        ) : (
          <>
            <Card className="p-3">
              <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Properties</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{propertiesTotal}</p>
            </Card>
            <Card className="p-3">
              <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Listings</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{listingsTotal}</p>
            </Card>
            <Card className="p-3">
              <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Leads</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{leadsTotal}</p>
            </Card>
            <Card className="p-3">
              <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">New (7d)</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{newLeadsThisWeek}</p>
            </Card>
          </>
        )}
      </div>

      {/* Charts: one row, shorter */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs font-medium">Leads (30d)</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            {isLoading ? (
              <Skeleton className="h-[180px] w-full" />
            ) : overTimeData.length > 0 ? (
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overTimeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reLeadsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 2" className="stroke-muted" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} width={24} className="text-muted-foreground" />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number | undefined) => [v ?? 0, "Leads"]} />
                    <Area type="monotone" dataKey="count" stroke="var(--primary)" fill="url(#reLeadsGrad)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[180px] items-center justify-center rounded border border-dashed bg-muted/10">
                <p className="text-muted-foreground text-xs">No data</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-xs font-medium">By status</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            {isLoading ? (
              <Skeleton className="h-[180px] w-full" />
            ) : byStatusData.length > 0 ? (
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byStatusData} layout="vertical" margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={56} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number | undefined) => [v ?? 0, "Leads"]} />
                    <Bar dataKey="count" radius={[0, 2, 2, 0]} maxBarSize={20}>
                      {byStatusData.map((entry, i) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.status] ?? `var(--chart-${(i % 5) + 1})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[180px] items-center justify-center rounded border border-dashed bg-muted/10">
                <p className="text-muted-foreground text-xs">No leads</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sources: compact card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-1 pt-3 px-3">
          <CardTitle className="flex items-center gap-1.5 text-xs font-medium">
            <Tag className="size-3" />
            Top sources
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          {isLoading ? (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-6 flex-1" />
              ))}
            </div>
          ) : bySourceData.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {bySourceData.map((s) => (
                <span
                  key={s.name}
                  className="inline-flex items-center gap-1.5 rounded border bg-muted/30 px-2 py-1 text-[11px]"
                >
                  <span className="capitalize font-medium">{s.name}</span>
                  <span className="tabular-nums text-muted-foreground">{s.count}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">No source data</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
