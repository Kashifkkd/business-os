"use client";

import Link from "next/link";
import { useTenant } from "@/hooks/use-tenant";
import { useLeadsStats } from "@/hooks/use-leads";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  UserPlus,
  Home,
  LayoutGrid,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

type TenantOverviewProps = {
  orgId: string;
};

export function TenantOverview({ orgId }: TenantOverviewProps) {
  const { tenant } = useTenant();
  const { data: leadsStats, isLoading: statsLoading } = useLeadsStats(orgId);

  if (!tenant) return null;

  const base = `/${tenant.id}`;
  const isRealEstate = tenant.industry === "real_estate";

  const quickLinks = isRealEstate
    ? [
        { href: `${base}/leads`, label: "Leads", icon: UserPlus },
        { href: `${base}/properties`, label: "Properties", icon: Home },
        { href: `${base}/listings`, label: "Listings", icon: LayoutGrid },
      ]
    : [
        { href: `${base}/leads`, label: "Leads", icon: UserPlus },
        { href: `${base}/menu/items`, label: "Menu", icon: LayoutDashboard },
      ];

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold">Overview</h1>
        <p className="text-muted-foreground text-sm">
          Welcome back. Here’s what’s happening in your workspace.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="size-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Total leads
                </CardTitle>
                <UserPlus className="text-muted-foreground size-4" />
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-semibold tabular-nums">
                  {leadsStats?.total ?? 0}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  New this week
                </CardTitle>
                <TrendingUp className="text-muted-foreground size-4" />
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-semibold tabular-nums">
                  {leadsStats?.newThisWeek ?? 0}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Workspace
                </CardTitle>
                <LayoutDashboard className="text-muted-foreground size-4" />
              </CardHeader>
              <CardContent>
                <span className="text-sm font-medium capitalize">
                  {tenant.name}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-sm font-medium capitalize">
                  {tenant.role}
                </span>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Quick actions</CardTitle>
          <CardDescription>
            Jump to the main areas of your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/60 hover:border-muted-foreground/20"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-md bg-background border">
                    <Icon className="text-muted-foreground size-4" />
                  </div>
                  <span className="font-medium text-sm">{label}</span>
                </div>
                <ArrowRight className="text-muted-foreground size-4 shrink-0" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
