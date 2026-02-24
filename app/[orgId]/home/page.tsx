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
      <div className="container mx-auto max-w-6xl p-4">
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!tenant) return null;

  return (
    <div className="container mx-auto max-w-5xl p-4">
      {tenant.industry === "cafe" ? (
        <>
          <div className="mb-4">
            <h1 className="text-lg font-semibold">Overview</h1>
            <p className="text-muted-foreground text-sm">
              Key metrics and recent activity.
            </p>
          </div>
          <CafeDashboard orgId={orgId ?? ""} showHeading={false} />
        </>
      ) : (
        <TenantOverview />
      )}
    </div>
  );
}
