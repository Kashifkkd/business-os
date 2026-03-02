"use client";

import { useParams } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { useMarketingAnalyticsSummary } from "@/hooks/use-marketing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, BarChart3, Layers3, Target } from "lucide-react";

export default function MarketingOverviewPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const { tenant } = useTenant();
  const { data, isLoading } = useMarketingAnalyticsSummary(orgId);

  const title = tenant ? `${tenant.name} marketing` : "Marketing";

  return (
    <div className="w-full min-w-0 px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="text-muted-foreground text-sm">
            Multi-channel campaigns, journeys, and performance at a glance.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-1 h-7 w-12" />
            </Card>
          ))
        ) : (
          <>
            <MetricCard
              icon={Megaphone}
              label="Total sends (30d)"
              value={data?.totalSends ?? 0}
            />
            <MetricCard
              icon={BarChart3}
              label="Open events (30d)"
              value={data?.totalOpened ?? 0}
            />
            <MetricCard
              icon={Target}
              label="Click events (30d)"
              value={data?.totalClicked ?? 0}
            />
            <MetricCard
              icon={Layers3}
              label="Active campaigns"
              value={data?.byCampaign?.filter((c) => c.sends > 0).length ?? 0}
            />
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-0 pt-1">
        <p className="text-xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

