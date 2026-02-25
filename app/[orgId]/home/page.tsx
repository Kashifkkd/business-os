"use client";

import { useParams } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { TenantOverview } from "../tenant-overview";
import { CafeDashboard } from "@/components/dashboard/cafe-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrgHomePage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const { tenant } = useTenant();

  if (orgId && !tenant) {
    return (
      <div className="w-full min-w-0 px-4 py-6 md:px-6 lg:px-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!tenant) return null;

  return (
    <div className="w-full min-w-0 px-4 py-6 md:px-6 lg:px-8">
      {tenant.industry === "cafe" ? (
        <>
          <div className="mb-6">
            <h1 className="text-lg font-semibold">Overview</h1>
            <p className="text-muted-foreground text-sm">
              Key metrics and recent activity.
            </p>
          </div>
          <CafeDashboard orgId={orgId ?? ""} showHeading={false} fullWidth />
        </>
      ) : (
        <TenantOverview orgId={orgId ?? ""} />
      )}
    </div>
  );
}
