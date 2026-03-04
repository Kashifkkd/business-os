"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { SalesOrder, SalesOrderItem } from "@/lib/supabase/types";
import type { GetSalesOrdersResult } from "@/lib/supabase/queries";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export type CreateSalesOrderPayload = {
  customer_id?: string | null;
  status?: string;
  order_number?: string | null;
  order_date: string;
  expected_ship_date?: string | null;
  currency?: string | null;
  notes?: string | null;
  items: { item_id: string; variant_id?: string | null; quantity: number; unit_price: number }[];
};

export type UpdateSalesOrderPayload = {
  customer_id?: string | null;
  status?: string;
  order_number?: string | null;
  order_date?: string;
  expected_ship_date?: string | null;
  currency?: string | null;
  notes?: string | null;
  items?: { item_id: string; variant_id?: string | null; quantity: number; unit_price: number }[];
};

export function useSalesOrdersPaginated(
  orgId: string | undefined,
  params: { page: number; pageSize: number; search?: string; status?: string },
  options?: Omit<UseQueryOptions<GetSalesOrdersResult>, "queryKey" | "queryFn">
) {
  const { page, pageSize, search, status } = params;
  return useQuery({
    queryKey: queryKeys.salesOrders(orgId ?? "", { page, pageSize, search, status }),
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 10 });
      const sp = new URLSearchParams();
      if (page > 1) sp.set("page", String(page));
      if (pageSize !== 10) sp.set("pageSize", String(pageSize));
      if (search) sp.set("search", search);
      if (status) sp.set("status", status);
      const q = sp.toString();
      return fetcherData<GetSalesOrdersResult>(
        `${API}/orgs/${orgId}/inventory/sales-orders${q ? `?${q}` : ""}`
      );
    },
    enabled: !!orgId,
    ...options,
  });
}

export function useSalesOrder(
  orgId: string | undefined,
  orderId: string | undefined,
  options?: Omit<UseQueryOptions<SalesOrder & { items?: (SalesOrderItem & { item_name?: string | null })[] } | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.salesOrder(orgId ?? "", orderId ?? ""),
    queryFn: () =>
      orgId && orderId
        ? fetcherData<SalesOrder & { items?: (SalesOrderItem & { item_name?: string | null })[] }>(
            `${API}/orgs/${orgId}/inventory/sales-orders/${orderId}`
          ).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!orderId,
    ...options,
  });
}

export function useCreateSalesOrder(
  orgId: string,
  options?: UseMutationOptions<SalesOrder, Error, CreateSalesOrderPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSalesOrderPayload) =>
      fetcherData<SalesOrder>(`${API}/orgs/${orgId}/inventory/sales-orders`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory", "sales-orders"] });
    },
    ...options,
  });
}

export function useUpdateSalesOrder(
  orgId: string,
  orderId: string,
  options?: UseMutationOptions<SalesOrder, Error, UpdateSalesOrderPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSalesOrderPayload) =>
      fetcherData<SalesOrder>(`${API}/orgs/${orgId}/inventory/sales-orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.salesOrder(orgId, orderId), data);
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory", "sales-orders"] });
    },
    ...options,
  });
}

export function useDeleteSalesOrder(
  orgId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      fetcherData<void>(`${API}/orgs/${orgId}/inventory/sales-orders/${orderId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory", "sales-orders"] });
    },
    ...options,
  });
}
