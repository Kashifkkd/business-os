"use client";

import { notFound } from "next/navigation";
import { AppProvider } from "@/contexts/app-context";
import { TenantProvider } from "@/contexts/tenant-context";
import { AppShell } from "@/components/app-shell";
import { ProjectLoader } from "@/components/loaders/project-loader";
import { useProfile } from "@/hooks/use-api";
import { useOrganization } from "@/hooks/use-organization";

export function OrgLayoutClient({
  orgId,
  children,
}: {
  orgId: string;
  children: React.ReactNode;
}) {
  const { data: profile, isLoading: userLoading } = useProfile();
  const user = profile ? { id: profile.id, email: profile.email ?? undefined } : null;
  const {
    organization,
    organizations,
    isLoading: orgLoading,
    isError: orgError,
  } = useOrganization(orgId);

  if (orgError || (!orgLoading && !organization)) {
    notFound();
  }

  const loading = userLoading || orgLoading;
  if (loading) {
    return (
      <div className="flex h-svh w-full items-center justify-center bg-background">
        <ProjectLoader
          message="Loading your workspace"
          subtext="Fetching organization and profile…"
          showLogo
        />
      </div>
    );
  }

  const appUser = user ? { id: user.id, email: user.email } : null;

  return (
    <AppProvider user={appUser} organizations={organizations}>
      <TenantProvider
        key={organization!.id}
        tenant={{
          id: organization!.id,
          name: organization!.name,
          industry: organization!.industry,
          role: organization!.role,
        }}
      >
        <AppShell>{children}</AppShell>
      </TenantProvider>
    </AppProvider>
  );
}
