"use client";

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from "@tanstack/react-query";
import type { GetVendorBillsFinanceResult } from "@/lib/supabase/queries";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export function useFinanceBills(
  orgId: string | undefined,
  params: { page: number; pageSize: number; search?: string; status?: string },
  options?: Omit<UseQueryOptions<GetVendorBillsFinanceResult>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.financeBills(orgId ?? "", params),
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: params.page, pageSize: params.pageSize });
      const sp = new URLSearchParams();
      sp.set("page", String(params.page));
      sp.set("pageSize", String(params.pageSize));
      if (params.search) sp.set("search", params.search);
      if (params.status) sp.set("status", params.status);
      return fetcherData<GetVendorBillsFinanceResult>(`${API}/orgs/${orgId}/finance/bills?${sp}`);
    },
    enabled: !!orgId,
    ...options,
  });
}

export function useFinanceBill(
  orgId: string | undefined,
  billId: string | undefined,
  options?: Omit<UseQueryOptions<Record<string, unknown> | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.financeBill(orgId ?? "", billId ?? ""),
    queryFn: () =>
      orgId && billId
        ? fetcherData<Record<string, unknown>>(`${API}/orgs/${orgId}/finance/bills/${billId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!billId,
    ...options,
  });
}

export function usePostFinanceBill(orgId: string, options?: UseMutationOptions<Record<string, unknown>, Error, string>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (billId: string) =>
      fetcherData<Record<string, unknown>>(`${API}/orgs/${orgId}/finance/bills/${billId}/post`, {
        method: "POST",
      }),
    onSuccess: (_, billId) => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "finance", "bills"] });
      qc.invalidateQueries({ queryKey: queryKeys.financeBill(orgId, billId) });
    },
    ...options,
  });
}
