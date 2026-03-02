"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { InventoryItemGroup } from "@/lib/supabase/types";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export type CreateItemGroupPayload = {
  name: string;
  description?: string | null;
  sort_order?: number;
};

export type UpdateItemGroupPayload = CreateItemGroupPayload;

export function useInventoryItemGroups(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<InventoryItemGroup[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.inventoryItemGroups(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<InventoryItemGroup[]>(`${API}/orgs/${orgId}/inventory/item-groups`)
        : Promise.resolve([]),
    enabled: !!orgId,
    ...options,
  });
}

export function useInventoryItemGroup(
  orgId: string | undefined,
  groupId: string | undefined,
  options?: Omit<UseQueryOptions<InventoryItemGroup | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.inventoryItemGroup(orgId ?? "", groupId ?? ""),
    queryFn: () =>
      orgId && groupId
        ? fetcherData<InventoryItemGroup>(`${API}/orgs/${orgId}/inventory/item-groups/${groupId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!groupId,
    ...options,
  });
}

export function useCreateInventoryItemGroup(
  orgId: string,
  options?: UseMutationOptions<InventoryItemGroup, Error, CreateItemGroupPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateItemGroupPayload) =>
      fetcherData<InventoryItemGroup>(`${API}/orgs/${orgId}/inventory/item-groups`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventoryItemGroups(orgId) });
    },
    ...options,
  });
}

export function useUpdateInventoryItemGroup(
  orgId: string,
  groupId: string,
  options?: UseMutationOptions<InventoryItemGroup, Error, UpdateItemGroupPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateItemGroupPayload) =>
      fetcherData<InventoryItemGroup>(`${API}/orgs/${orgId}/inventory/item-groups/${groupId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.inventoryItemGroup(orgId, groupId), data);
      qc.invalidateQueries({ queryKey: queryKeys.inventoryItemGroups(orgId) });
    },
    ...options,
  });
}

export function useDeleteInventoryItemGroup(
  orgId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) =>
      fetcherData<void>(`${API}/orgs/${orgId}/inventory/item-groups/${groupId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventoryItemGroups(orgId) });
    },
    ...options,
  });
}
