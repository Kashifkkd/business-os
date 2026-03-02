"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { useSalesStats } from "@/hooks/use-sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, LayoutGrid, Target, ArrowRight } from "lucide-react";

function formatCurrency(value: number, currencySymbol: string): string {
  return `${currencySymbol}${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function SalesOverviewPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const { tenant } = useTenant();
  const { data: stats, isLoading } = useSalesStats(orgId);

  const symbol = tenant?.currency_symbol ?? "$";

  return (
    <div className="w-full min-w-0 px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Sales</h1>
          <p className="text-muted-foreground text-sm">
            Pipeline, deals, and revenue at a glance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/${orgId}/sales/pipeline`}>
              <LayoutGrid className="size-3.5" />
              Pipeline
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/${orgId}/sales/deals/new`}>
              New deal
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-1 h-7 w-24" />
            </Card>
          ))
        ) : (
          <>
            <Card className="p-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">Pipeline value</CardTitle>
                <DollarSign className="size-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0 pt-1">
                <p className="text-xl font-semibold tabular-nums">
                  {formatCurrency(stats?.totalPipelineValue ?? 0, symbol)}
                </p>
              </CardContent>
            </Card>
            <Card className="p-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">Won value</CardTitle>
                <TrendingUp className="size-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0 pt-1">
                <p className="text-xl font-semibold tabular-nums text-green-600 dark:text-green-400">
                  {formatCurrency(stats?.wonValue ?? 0, symbol)}
                </p>
              </CardContent>
            </Card>
            <Card className="p-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">Open deals</CardTitle>
                <LayoutGrid className="size-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0 pt-1">
                <p className="text-xl font-semibold tabular-nums">{stats?.openDeals ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="p-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">Win rate</CardTitle>
                <Target className="size-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0 pt-1">
                <p className="text-xl font-semibold tabular-nums">
                  {stats?.winRate != null ? `${Math.round(stats.winRate)}%` : "—"}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${orgId}/sales/deals`}>
            View all deals
            <ArrowRight className="ml-1 size-3.5" />
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${orgId}/sales/forecast`}>Forecast</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${orgId}/sales/analytics`}>Analytics</Link>
        </Button>
      </div>
    </div>
  );
}
