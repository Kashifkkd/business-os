"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { InventoryPackage } from "@/lib/supabase/types";
import type { GetPackagesResult } from "@/lib/supabase/queries";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export type CreateInventoryPackagePayload = {
  picklist_id: string;
  carrier?: string | null;
  tracking_number?: string | null;
  status?: string;
  notes?: string | null;
};

export type UpdateInventoryPackagePayload = {
  carrier?: string | null;
  tracking_number?: string | null;
  status?: string;
  shipped_at?: string | null;
  delivered_at?: string | null;
  notes?: string | null;
};

export function useInventoryPackagesPaginated(
  orgId: string | undefined,
  params: { page: number; pageSize: number; status?: string },
  options?: Omit<UseQueryOptions<GetPackagesResult>, "queryKey" | "queryFn">
) {
  const { page, pageSize, status } = params;
  return useQuery({
    queryKey: queryKeys.inventoryPackages(orgId ?? "", { page, pageSize, status }),
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 10 });
      const sp = new URLSearchParams();
      if (page > 1) sp.set("page", String(page));
      if (pageSize !== 10) sp.set("pageSize", String(pageSize));
      if (status) sp.set("status", status);
      const q = sp.toString();
      return fetcherData<GetPackagesResult>(
        `${API}/orgs/${orgId}/inventory/packages${q ? `?${q}` : ""}`
      );
    },
    enabled: !!orgId,
    ...options,
  });
}

export function useInventoryPackage(
  orgId: string | undefined,
  packageId: string | undefined,
  options?: Omit<UseQueryOptions<InventoryPackage | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.inventoryPackage(orgId ?? "", packageId ?? ""),
    queryFn: () =>
      orgId && packageId
        ? fetcherData<InventoryPackage>(`${API}/orgs/${orgId}/inventory/packages/${packageId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!packageId,
    ...options,
  });
}

export function useCreateInventoryPackage(
  orgId: string,
  options?: UseMutationOptions<InventoryPackage, Error, CreateInventoryPackagePayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInventoryPackagePayload) =>
      fetcherData<InventoryPackage>(`${API}/orgs/${orgId}/inventory/packages`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory", "packages"] });
    },
    ...options,
  });
}

export function useUpdateInventoryPackage(
  orgId: string,
  packageId: string,
  options?: UseMutationOptions<InventoryPackage, Error, UpdateInventoryPackagePayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateInventoryPackagePayload) =>
      fetcherData<InventoryPackage>(`${API}/orgs/${orgId}/inventory/packages/${packageId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.inventoryPackage(orgId, packageId), data);
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory", "packages"] });
    },
    ...options,
  });
}

export function useDeleteInventoryPackage(
  orgId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (packageId: string) =>
      fetcherData<void>(`${API}/orgs/${orgId}/inventory/packages/${packageId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory", "packages"] });
    },
    ...options,
  });
}
