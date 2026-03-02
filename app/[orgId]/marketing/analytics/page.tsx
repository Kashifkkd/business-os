"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMarketingAnalyticsSummary } from "@/hooks/use-marketing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Send, MailOpen, MousePointer, AlertCircle } from "lucide-react";

const DAYS_OPTIONS = [7, 30, 90];

export default function MarketingAnalyticsPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const [days, setDays] = useState(30);

  const { data, isLoading } = useMarketingAnalyticsSummary(orgId, days);

  if (!orgId) return null;

  const openRate =
    (data?.totalSends ?? 0) > 0
      ? Math.round(((data?.totalOpened ?? 0) / (data?.totalSends ?? 1)) * 100)
      : 0;
  const clickRate =
    (data?.totalSends ?? 0) > 0
      ? Math.round(((data?.totalClicked ?? 0) / (data?.totalSends ?? 1)) * 100)
      : 0;

  return (
    <div className="w-full min-w-0 px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Marketing analytics</h1>
          <p className="text-muted-foreground text-sm">
            Sends, opens, clicks, and performance by channel and campaign.
          </p>
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAYS_OPTIONS.map((d) => (
              <SelectItem key={d} value={String(d)}>
                Last {d} days
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        {isLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-1 h-7 w-12" />
            </Card>
          ))
        ) : (
          <>
            <Card className="p-3">
              <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                Total sends
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {data?.totalSends ?? 0}
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                Delivered
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {data?.totalDelivered ?? 0}
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider flex items-center gap-1">
                <MailOpen className="size-3" /> Open rate
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{openRate}%</p>
            </Card>
            <Card className="p-3">
              <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider flex items-center gap-1">
                <MousePointer className="size-3" /> Click rate
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{clickRate}%</p>
            </Card>
            <Card className="p-3">
              <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider flex items-center gap-1">
                <AlertCircle className="size-3" /> Bounced
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-destructive">
                {data?.totalBounced ?? 0}
              </p>
            </Card>
          </>
        )}
      </div>

      {/* By channel */}
      <Card className="overflow-hidden mb-6">
        <CardHeader className="pb-1 pt-3 px-3">
          <CardTitle className="text-xs font-medium">Performance by channel</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0">
          {isLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (data?.byChannel?.length ?? 0) > 0 ? (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data!.byChannel.map((c) => ({
                    name: c.channel,
                    sends: c.sends,
                    opened: c.opened,
                    clicked: c.clicked,
                  }))}
                  margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="2 2" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground capitalize"
                  />
                  <YAxis tick={{ fontSize: 10 }} width={24} />
                  <Tooltip
                    contentStyle={{ fontSize: 11 }}
                    formatter={(value: number) => [value, ""]}
                    labelFormatter={(label) => `Channel: ${label}`}
                  />
                  <Bar dataKey="sends" fill="var(--chart-1)" radius={[2, 2, 0, 0]} name="Sends" />
                  <Bar dataKey="opened" fill="var(--chart-2)" radius={[2, 2, 0, 0]} name="Opened" />
                  <Bar dataKey="clicked" fill="var(--chart-3)" radius={[2, 2, 0, 0]} name="Clicked" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[180px] items-center justify-center rounded border border-dashed bg-muted/10">
              <p className="text-muted-foreground text-xs">No channel data in this period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* By campaign table */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-1 pt-3 px-3">
          <CardTitle className="text-xs font-medium">By campaign</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0">
          {isLoading ? (
            <Skeleton className="h-[120px] w-full" />
          ) : (data?.byCampaign?.length ?? 0) > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="h-8 px-3 text-xs">Campaign</TableHead>
                    <TableHead className="h-8 px-3 text-xs text-right">Sends</TableHead>
                    <TableHead className="h-8 px-3 text-xs text-right">Opened</TableHead>
                    <TableHead className="h-8 px-3 text-xs text-right">Clicked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data!.byCampaign
                    .filter((c) => c.sends > 0 || c.campaign_name)
                    .map((c) => (
                      <TableRow key={c.campaign_id ?? "unknown"}>
                        <TableCell className="py-1.5 px-3 text-sm">
                          {c.campaign_name ?? "Unknown campaign"}
                        </TableCell>
                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">
                          {c.sends}
                        </TableCell>
                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">
                          {c.opened}
                        </TableCell>
                        <TableCell className="py-1.5 px-3 text-sm text-right tabular-nums">
                          {c.clicked}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs py-4">No campaign data in this period</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
