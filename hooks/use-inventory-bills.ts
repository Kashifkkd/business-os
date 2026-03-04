"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { VendorBill } from "@/lib/supabase/types";
import type { GetInventoryVendorBillsResult } from "@/lib/supabase/queries";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export type CreateVendorBillPayload = {
  vendor_id: string;
  purchase_order_id?: string | null;
  bill_number?: string | null;
  bill_date: string;
  due_date?: string | null;
  currency?: string | null;
  amount: number;
  status?: string;
  notes?: string | null;
};

export type UpdateVendorBillPayload = {
  bill_number?: string | null;
  bill_date?: string;
  due_date?: string | null;
  currency?: string | null;
  amount?: number;
  status?: string;
  notes?: string | null;
};

export function useInventoryBillsPaginated(
  orgId: string | undefined,
  params: { page: number; pageSize: number; search?: string; status?: string },
  options?: Omit<UseQueryOptions<GetInventoryVendorBillsResult>, "queryKey" | "queryFn">
) {
  const { page, pageSize, search, status } = params;
  return useQuery({
    queryKey: queryKeys.inventoryBills(orgId ?? "", { page, pageSize, search, status }),
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 10 });
      const sp = new URLSearchParams();
      if (page > 1) sp.set("page", String(page));
      if (pageSize !== 10) sp.set("pageSize", String(pageSize));
      if (search) sp.set("search", search);
      if (status) sp.set("status", status);
      const q = sp.toString();
      return fetcherData<GetInventoryVendorBillsResult>(
        `${API}/orgs/${orgId}/inventory/bills${q ? `?${q}` : ""}`
      );
    },
    enabled: !!orgId,
    ...options,
  });
}

export function useInventoryBill(
  orgId: string | undefined,
  billId: string | undefined,
  options?: Omit<UseQueryOptions<VendorBill | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.inventoryBill(orgId ?? "", billId ?? ""),
    queryFn: () =>
      orgId && billId
        ? fetcherData<VendorBill>(`${API}/orgs/${orgId}/inventory/bills/${billId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!billId,
    ...options,
  });
}

export function useCreateInventoryBill(
  orgId: string,
  options?: UseMutationOptions<VendorBill, Error, CreateVendorBillPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVendorBillPayload) =>
      fetcherData<VendorBill>(`${API}/orgs/${orgId}/inventory/bills`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory", "bills"] });
    },
    ...options,
  });
}

export function useUpdateInventoryBill(
  orgId: string,
  billId: string,
  options?: UseMutationOptions<VendorBill, Error, UpdateVendorBillPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateVendorBillPayload) =>
      fetcherData<VendorBill>(`${API}/orgs/${orgId}/inventory/bills/${billId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.inventoryBill(orgId, billId), data);
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory", "bills"] });
    },
    ...options,
  });
}

export function useDeleteInventoryBill(
  orgId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (billId: string) =>
      fetcherData<void>(`${API}/orgs/${orgId}/inventory/bills/${billId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory", "bills"] });
    },
    ...options,
  });
}
