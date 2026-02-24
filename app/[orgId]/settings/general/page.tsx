"use client";

import { useParams } from "next/navigation";
import { useOrganization } from "@/hooks/use-organization";
import { OrganizationInfoForm } from "./organization-info-form";
import { SettingsPageSkeleton } from "../settings-page-skeleton";

export default function GeneralSettingsPage() {
  const params = useParams();
  const orgId = params?.orgId as string | undefined;
  const { organization: org, isLoading, error } = useOrganization(orgId);

  if (!orgId) return null;
  if (isLoading) return <SettingsPageSkeleton variant="form" />;
  if (error) {
    return (
      <div className="space-y-6">
        <p className="text-destructive text-sm">{error.message}</p>
      </div>
    );
  }
  if (!org) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground text-sm">Organization not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organization Info</h1>
        <p className="text-muted-foreground text-sm">
          Edit basic organization details. Changes affect the whole organization.
        </p>
      </div>
      <OrganizationInfoForm
        orgId={orgId}
        initialName={org.name}
        initialIndustry={org.industry}
      />
    </div>
  );
}
