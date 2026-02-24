"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TenantLocaleUpdate } from "@/lib/supabase/types";
import type { TenantWithRole, TenantMemberWithProfile } from "@/lib/supabase/queries";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export type OrgUpdatePayload = {
  name?: string;
  industry?: "cafe" | "real_estate";
  logo_url?: string | null;
} & TenantLocaleUpdate;

export interface UseOrganizationOptions {
  /** Skip fetching single organization and members when false (e.g. when orgId is undefined). */
  enabled?: boolean;
}

/**
 * Single hook for all organization data and actions.
 * Returns organization (current org), organizations (list), orgMembers, updateOrg, and loading/error state.
 */
export function useOrganization(orgId: string | undefined, options?: UseOrganizationOptions) {
  const enabled = options?.enabled !== false;
  const qc = useQueryClient();

  const organizationQuery = useQuery({
    queryKey: queryKeys.org(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<TenantWithRole>(`${API}/orgs/${orgId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && enabled,
  });

  const organizationsQuery = useQuery({
    queryKey: queryKeys.orgs(),
    queryFn: () => fetcherData<TenantWithRole[]>(`${API}/orgs`),
    enabled,
  });

  const orgMembersQuery = useQuery({
    queryKey: queryKeys.orgMembers(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<TenantMemberWithProfile[]>(`${API}/orgs/${orgId}/members`)
        : Promise.resolve([]),
    enabled: !!orgId && enabled,
  });

  const updateOrgMutation = useMutation({
    mutationFn: (data: OrgUpdatePayload) =>
      orgId
        ? fetcherData<TenantWithRole>(`${API}/orgs/${orgId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
          })
        : Promise.reject(new Error("orgId required")),
    onSuccess: (data) => {
      if (orgId) {
        qc.setQueryData(queryKeys.org(orgId), data);
        qc.invalidateQueries({ queryKey: queryKeys.orgs() });
      }
    },
  });

  return {
    // data
    organization: organizationQuery.data ?? null,
    organizations: organizationsQuery.data ?? [],
    orgMembers: orgMembersQuery.data ?? [],

    // mutations
    updateOrg: updateOrgMutation,

    // loading
    isLoading:
      organizationQuery.isLoading ||
      organizationsQuery.isLoading ||
      orgMembersQuery.isLoading,
    isLoadingOrganization: organizationQuery.isLoading,
    isLoadingOrganizations: organizationsQuery.isLoading,
    isLoadingOrgMembers: orgMembersQuery.isLoading,

    // fetching (background refetch)
    isFetching:
      organizationQuery.isFetching ||
      organizationsQuery.isFetching ||
      orgMembersQuery.isFetching,

    // error
    error:
      organizationQuery.error ??
      organizationsQuery.error ??
      orgMembersQuery.error,
    isError:
      organizationQuery.isError ||
      organizationsQuery.isError ||
      orgMembersQuery.isError,

    // refetch
    refetchOrganization: organizationQuery.refetch,
    refetchOrganizations: organizationsQuery.refetch,
    refetchOrgMembers: orgMembersQuery.refetch,
  };
}
