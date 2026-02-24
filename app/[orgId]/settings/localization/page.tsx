"use client";

import { useParams } from "next/navigation";
import { useOrganization } from "@/hooks/use-organization";
import { LocalizationForm } from "./localization-form";
import { SettingsPageSkeleton } from "../settings-page-skeleton";

export default function LocalizationSettingsPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Localization</h1>
        <p className="text-muted-foreground text-sm">
          Timezone, date and time format, currency, and locale for this organization.
        </p>
      </div>
      <LocalizationForm orgId={orgId} org={org ?? null} />
    </div>
  );
}
