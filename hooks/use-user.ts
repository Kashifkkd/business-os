"use client";

import { useProfile } from "@/hooks/use-api";
import type { AppUser } from "@/contexts/app-context";

/**
 * Fetches the current user from /api/me/profile.
 * Returns user (or null when signed out) and loading state until the request completes.
 */
export function useUser(): {
  user: AppUser | null;
  isLoading: boolean;
} {
  const { data: profile, isLoading } = useProfile();
  const user: AppUser | null =
    profile != null
      ? { id: profile.id, email: profile.email ?? undefined }
      : null;
  return { user, isLoading };
}
