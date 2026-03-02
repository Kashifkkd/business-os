"use client";

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from "@tanstack/react-query";
import type { GetInvoicesResult } from "@/lib/supabase/queries";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export function useFinanceInvoices(
  orgId: string | undefined,
  params: { page: number; pageSize: number; search?: string; status?: string },
  options?: Omit<UseQueryOptions<GetInvoicesResult>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.financeInvoices(orgId ?? "", params),
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: params.page, pageSize: params.pageSize });
      const sp = new URLSearchParams();
      sp.set("page", String(params.page));
      sp.set("pageSize", String(params.pageSize));
      if (params.search) sp.set("search", params.search);
      if (params.status) sp.set("status", params.status);
      return fetcherData<GetInvoicesResult>(`${API}/orgs/${orgId}/finance/invoices?${sp}`);
    },
    enabled: !!orgId,
    ...options,
  });
}

export function useFinanceInvoice(
  orgId: string | undefined,
  invoiceId: string | undefined,
  options?: Omit<UseQueryOptions<Record<string, unknown> | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.financeInvoice(orgId ?? "", invoiceId ?? ""),
    queryFn: () =>
      orgId && invoiceId
        ? fetcherData<Record<string, unknown>>(`${API}/orgs/${orgId}/finance/invoices/${invoiceId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!invoiceId,
    ...options,
  });
}

export function usePostFinanceInvoice(orgId: string, options?: UseMutationOptions<Record<string, unknown>, Error, string>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) =>
      fetcherData<Record<string, unknown>>(`${API}/orgs/${orgId}/finance/invoices/${invoiceId}/post`, {
        method: "POST",
      }),
    onSuccess: (_, invoiceId) => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "finance", "invoices"] });
      qc.invalidateQueries({ queryKey: queryKeys.financeInvoice(orgId, invoiceId) });
    },
    ...options,
  });
}
