"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { TenantOverview } from "../tenant-overview";
import { CafeDashboard } from "@/components/dashboard/cafe-dashboard";
import { RealEstateDashboard } from "@/components/dashboard/real-estate-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function OrgHomePage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const { tenant } = useTenant();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);

  async function handleLoadDemo() {
    if (!orgId) return;
    setDemoMessage(null);
    setLoadingDemo(true);
    try {
      const res = await fetch(`/api/orgs/${orgId}/demo/load`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: { message?: string }; data?: { summary?: Record<string, number> } }
        | null;

      if (!res.ok || !body || body.success === false) {
        const message =
          (body && body.error && body.error.message) ||
          "Failed to load demo data. Please try again.";
        setDemoMessage(message);
        return;
      }

      const summary = body.data?.summary;
      const parts = summary
        ? Object.entries(summary)
            .filter(([, count]) => count > 0)
            .map(([key, count]) => `${count} ${key}`)
        : [];
      setDemoMessage(
        parts.length > 0
          ? `Demo data loaded (${parts.join(", ")}).`
          : "Demo data loaded."
      );
    } catch {
      setDemoMessage("Failed to load demo data. Please try again.");
    } finally {
      setLoadingDemo(false);
    }
  }

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
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Overview</h1>
          <p className="text-muted-foreground text-sm">
            Key metrics and recent activity across your workspace.
          </p>
        </div>
        <div className="flex flex-col items-start gap-1 md:items-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLoadDemo}
            disabled={loadingDemo || !orgId}
          >
            {loadingDemo ? "Loading demo data…" : "Load demo data"}
          </Button>
          {demoMessage && (
            <p className="max-w-xs text-xs text-muted-foreground text-left md:text-right">
              {demoMessage}
            </p>
          )}
        </div>
      </div>

      {tenant.industry === "cafe" ? (
        <CafeDashboard orgId={orgId ?? ""} showHeading={false} fullWidth />
      ) : tenant.industry === "real_estate" ? (
        <RealEstateDashboard orgId={orgId ?? ""} />
      ) : (
        <TenantOverview orgId={orgId ?? ""} />
      )}
    </div>
  );
}
