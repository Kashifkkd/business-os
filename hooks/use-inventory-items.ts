"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { InventoryItem } from "@/lib/supabase/types";
import type { GetInventoryItemsResult } from "@/lib/supabase/queries";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export type CreateInventoryItemPayload = {
  name: string;
  sku?: string | null;
  description?: string | null;
  unit?: string | null;
  group_id?: string | null;
  is_active?: boolean;
  reorder_level?: number | null;
  cost?: number | null;
  selling_price?: number | null;
  tax_rate?: number | null;
};

export type UpdateInventoryItemPayload = CreateInventoryItemPayload;

export function useInventoryItemsPaginated(
  orgId: string | undefined,
  params: { page: number; pageSize: number; search?: string },
  options?: Omit<UseQueryOptions<GetInventoryItemsResult>, "queryKey" | "queryFn">
) {
  const { page, pageSize, search } = params;
  return useQuery({
    queryKey: queryKeys.inventoryItems(orgId ?? "", { page, pageSize, search }),
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 10 });
      const sp = new URLSearchParams();
      if (page > 1) sp.set("page", String(page));
      if (pageSize !== 10) sp.set("pageSize", String(pageSize));
      if (search) sp.set("search", search);
      const q = sp.toString();
      return fetcherData<GetInventoryItemsResult>(
        `${API}/orgs/${orgId}/inventory/items${q ? `?${q}` : ""}`
      );
    },
    enabled: !!orgId,
    ...options,
  });
}

export function useInventoryItem(
  orgId: string | undefined,
  itemId: string | undefined,
  options?: Omit<UseQueryOptions<InventoryItem | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.inventoryItem(orgId ?? "", itemId ?? ""),
    queryFn: () =>
      orgId && itemId
        ? fetcherData<InventoryItem>(`${API}/orgs/${orgId}/inventory/items/${itemId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!itemId,
    ...options,
  });
}

export function useCreateInventoryItem(
  orgId: string,
  options?: UseMutationOptions<InventoryItem, Error, CreateInventoryItemPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInventoryItemPayload) =>
      fetcherData<InventoryItem>(`${API}/orgs/${orgId}/inventory/items`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory"] });
    },
    ...options,
  });
}

export function useUpdateInventoryItem(
  orgId: string,
  itemId: string,
  options?: UseMutationOptions<InventoryItem, Error, UpdateInventoryItemPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateInventoryItemPayload) =>
      fetcherData<InventoryItem>(`${API}/orgs/${orgId}/inventory/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.inventoryItem(orgId, itemId), data);
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory"] });
    },
    ...options,
  });
}

export function useDeleteInventoryItem(
  orgId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      fetcherData<void>(`${API}/orgs/${orgId}/inventory/items/${itemId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory"] });
    },
    ...options,
  });
}
