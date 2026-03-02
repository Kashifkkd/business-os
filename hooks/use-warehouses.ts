"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Warehouse } from "@/lib/supabase/types";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export type CreateWarehousePayload = {
  name: string;
  code?: string | null;
  is_default?: boolean;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state_or_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

export type UpdateWarehousePayload = CreateWarehousePayload;

export function useWarehouses(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<Warehouse[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.warehouses(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<Warehouse[]>(`${API}/orgs/${orgId}/inventory/warehouses`)
        : Promise.resolve([]),
    enabled: !!orgId,
    ...options,
  });
}

export function useWarehouse(
  orgId: string | undefined,
  warehouseId: string | undefined,
  options?: Omit<UseQueryOptions<Warehouse | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.warehouse(orgId ?? "", warehouseId ?? ""),
    queryFn: () =>
      orgId && warehouseId
        ? fetcherData<Warehouse>(`${API}/orgs/${orgId}/inventory/warehouses/${warehouseId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!warehouseId,
    ...options,
  });
}

export function useCreateWarehouse(
  orgId: string,
  options?: UseMutationOptions<Warehouse, Error, CreateWarehousePayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWarehousePayload) =>
      fetcherData<Warehouse>(`${API}/orgs/${orgId}/inventory/warehouses`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouses(orgId) });
    },
    ...options,
  });
}

export function useUpdateWarehouse(
  orgId: string,
  warehouseId: string,
  options?: UseMutationOptions<Warehouse, Error, UpdateWarehousePayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateWarehousePayload) =>
      fetcherData<Warehouse>(`${API}/orgs/${orgId}/inventory/warehouses/${warehouseId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.warehouse(orgId, warehouseId), data);
      qc.invalidateQueries({ queryKey: queryKeys.warehouses(orgId) });
    },
    ...options,
  });
}

export function useDeleteWarehouse(
  orgId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (warehouseId: string) =>
      fetcherData<void>(`${API}/orgs/${orgId}/inventory/warehouses/${warehouseId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouses(orgId) });
    },
    ...options,
  });
}
