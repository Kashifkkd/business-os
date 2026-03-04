"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { PurchaseOrder, PurchaseOrderItem } from "@/lib/supabase/types";
import type { GetPurchaseOrdersResult } from "@/lib/supabase/queries";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export type CreatePurchaseOrderPayload = {
  vendor_id: string;
  warehouse_id?: string | null;
  status?: string;
  order_number?: string | null;
  order_date: string;
  expected_date?: string | null;
  currency?: string | null;
  notes?: string | null;
  items: { item_id: string; variant_id?: string | null; quantity: number; unit_cost: number }[];
};

export type UpdatePurchaseOrderPayload = {
  warehouse_id?: string | null;
  status?: string;
  order_number?: string | null;
  order_date?: string;
  expected_date?: string | null;
  currency?: string | null;
  notes?: string | null;
  items?: { item_id: string; variant_id?: string | null; quantity: number; unit_cost: number }[];
};

export function usePurchaseOrdersPaginated(
  orgId: string | undefined,
  params: { page: number; pageSize: number; search?: string; status?: string },
  options?: Omit<UseQueryOptions<GetPurchaseOrdersResult>, "queryKey" | "queryFn">
) {
  const { page, pageSize, search, status } = params;
  return useQuery({
    queryKey: queryKeys.purchaseOrders(orgId ?? "", { page, pageSize, search, status }),
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 10 });
      const sp = new URLSearchParams();
      if (page > 1) sp.set("page", String(page));
      if (pageSize !== 10) sp.set("pageSize", String(pageSize));
      if (search) sp.set("search", search);
      if (status) sp.set("status", status);
      const q = sp.toString();
      return fetcherData<GetPurchaseOrdersResult>(
        `${API}/orgs/${orgId}/inventory/purchase-orders${q ? `?${q}` : ""}`
      );
    },
    enabled: !!orgId,
    ...options,
  });
}

export function usePurchaseOrder(
  orgId: string | undefined,
  poId: string | undefined,
  options?: Omit<UseQueryOptions<PurchaseOrder & { items?: (PurchaseOrderItem & { item_name?: string | null })[] } | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.purchaseOrder(orgId ?? "", poId ?? ""),
    queryFn: () =>
      orgId && poId
        ? fetcherData<PurchaseOrder & { items?: (PurchaseOrderItem & { item_name?: string | null })[] }>(
            `${API}/orgs/${orgId}/inventory/purchase-orders/${poId}`
          ).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!poId,
    ...options,
  });
}

export function useCreatePurchaseOrder(
  orgId: string,
  options?: UseMutationOptions<PurchaseOrder, Error, CreatePurchaseOrderPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePurchaseOrderPayload) =>
      fetcherData<PurchaseOrder>(`${API}/orgs/${orgId}/inventory/purchase-orders`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory", "purchase-orders"] });
    },
    ...options,
  });
}

export function useUpdatePurchaseOrder(
  orgId: string,
  poId: string,
  options?: UseMutationOptions<PurchaseOrder, Error, UpdatePurchaseOrderPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePurchaseOrderPayload) =>
      fetcherData<PurchaseOrder>(`${API}/orgs/${orgId}/inventory/purchase-orders/${poId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.purchaseOrder(orgId, poId), data);
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory", "purchase-orders"] });
    },
    ...options,
  });
}

export function useDeletePurchaseOrder(
  orgId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (poId: string) =>
      fetcherData<void>(`${API}/orgs/${orgId}/inventory/purchase-orders/${poId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory", "purchase-orders"] });
    },
    ...options,
  });
}
