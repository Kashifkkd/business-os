"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Lead } from "@/lib/supabase/types";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export interface GetLeadsResult {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
}

export type CreateLeadPayload = {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source?: string | null;
  status?: string | null;
  notes?: string | null;
};

export type UpdateLeadPayload = Partial<{
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: string;
  notes: string | null;
}>;

/** Paginated leads list. */
export function useLeads(
  orgId: string | undefined,
  params: { page: number; pageSize: number; search?: string; status?: string },
  options?: Omit<UseQueryOptions<GetLeadsResult>, "queryKey" | "queryFn">
) {
  const { page, pageSize, search, status } = params;
  return useQuery({
    queryKey: queryKeys.leads(orgId ?? "", { page, pageSize, search, status }),
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 10 });
      const sp = new URLSearchParams();
      if (page > 1) sp.set("page", String(page));
      if (pageSize !== 10) sp.set("pageSize", String(pageSize));
      if (search) sp.set("search", search);
      if (status) sp.set("status", status);
      const q = sp.toString();
      return fetcherData<GetLeadsResult>(`${API}/orgs/${orgId}/leads${q ? `?${q}` : ""}`);
    },
    enabled: !!orgId,
    ...options,
  });
}

/** Single lead (for detail/edit). */
export function useLead(
  orgId: string | undefined,
  leadId: string | undefined,
  options?: Omit<UseQueryOptions<Lead | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.lead(orgId ?? "", leadId ?? ""),
    queryFn: () =>
      orgId && leadId
        ? fetcherData<Lead>(`${API}/orgs/${orgId}/leads/${leadId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!leadId,
    ...options,
  });
}

/** Create a lead. Invalidates leads list. */
export function useCreateLead(
  orgId: string,
  options?: UseMutationOptions<Lead, Error, CreateLeadPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLeadPayload) =>
      fetcherData<Lead>(`${API}/orgs/${orgId}/leads`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "leads"] });
    },
    ...options,
  });
}

/** Update a lead. Invalidates lead and list. */
export function useUpdateLead(
  orgId: string,
  leadId: string,
  options?: UseMutationOptions<Lead, Error, UpdateLeadPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateLeadPayload) =>
      fetcherData<Lead>(`${API}/orgs/${orgId}/leads/${leadId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.lead(orgId, leadId), data);
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "leads"] });
    },
    ...options,
  });
}

/** Delete a lead. Invalidates leads list. */
export function useDeleteLead(
  orgId: string,
  options?: UseMutationOptions<{ deleted: true }, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) =>
      fetcherData<{ deleted: true }>(`${API}/orgs/${orgId}/leads/${leadId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "leads"] });
    },
    ...options,
  });
}
