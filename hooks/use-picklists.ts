"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Picklist } from "@/lib/supabase/types";
import type { GetPicklistsResult } from "@/lib/supabase/queries";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export type CreatePicklistPayload = {
  sales_order_id: string;
  warehouse_id: string;
  status?: string;
  notes?: string | null;
};

export type UpdatePicklistPayload = {
  status?: string;
  notes?: string | null;
};

export function usePicklistsPaginated(
  orgId: string | undefined,
  params: { page: number; pageSize: number; status?: string },
  options?: Omit<UseQueryOptions<GetPicklistsResult>, "queryKey" | "queryFn">
) {
  const { page, pageSize, status } = params;
  return useQuery({
    queryKey: queryKeys.picklists(orgId ?? "", { page, pageSize, status }),
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 10 });
      const sp = new URLSearchParams();
      if (page > 1) sp.set("page", String(page));
      if (pageSize !== 10) sp.set("pageSize", String(pageSize));
      if (status) sp.set("status", status);
      const q = sp.toString();
      return fetcherData<GetPicklistsResult>(
        `${API}/orgs/${orgId}/inventory/picklists${q ? `?${q}` : ""}`
      );
    },
    enabled: !!orgId,
    ...options,
  });
}

export function usePicklist(
  orgId: string | undefined,
  picklistId: string | undefined,
  options?: Omit<UseQueryOptions<Picklist | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.picklist(orgId ?? "", picklistId ?? ""),
    queryFn: () =>
      orgId && picklistId
        ? fetcherData<Picklist>(`${API}/orgs/${orgId}/inventory/picklists/${picklistId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!picklistId,
    ...options,
  });
}

export function useCreatePicklist(
  orgId: string,
  options?: UseMutationOptions<Picklist, Error, CreatePicklistPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePicklistPayload) =>
      fetcherData<Picklist>(`${API}/orgs/${orgId}/inventory/picklists`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory", "picklists"] });
    },
    ...options,
  });
}

export function useUpdatePicklist(
  orgId: string,
  picklistId: string,
  options?: UseMutationOptions<Picklist, Error, UpdatePicklistPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePicklistPayload) =>
      fetcherData<Picklist>(`${API}/orgs/${orgId}/inventory/picklists/${picklistId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.picklist(orgId, picklistId), data);
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory", "picklists"] });
    },
    ...options,
  });
}

export function useDeletePicklist(
  orgId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (picklistId: string) =>
      fetcherData<void>(`${API}/orgs/${orgId}/inventory/picklists/${picklistId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory", "picklists"] });
    },
    ...options,
  });
}
