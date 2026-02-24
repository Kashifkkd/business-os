"use client";

import { useParams } from "next/navigation";
import { useProfile } from "@/hooks/use-api";
import { ProfileForm } from "./profile-form";
import { SettingsPageSkeleton } from "../settings/settings-page-skeleton";

export default function ProfilePage() {
  const params = useParams();
  const orgId = params?.orgId as string | undefined;
  const { data: profile, isLoading, error } = useProfile();

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
      <ProfileForm profile={profile ?? null} />
    </div>
  );
}
