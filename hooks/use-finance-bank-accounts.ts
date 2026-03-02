"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { GetBankAccountsResult } from "@/lib/supabase/queries";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export function useFinanceBankAccounts(
  orgId: string | undefined,
  params: { page: number; pageSize: number },
  options?: Omit<UseQueryOptions<GetBankAccountsResult>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.financeBankAccounts(orgId ?? "", params),
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: params.page, pageSize: params.pageSize });
      const sp = new URLSearchParams();
      sp.set("page", String(params.page));
      sp.set("pageSize", String(params.pageSize));
      return fetcherData<GetBankAccountsResult>(`${API}/orgs/${orgId}/finance/bank-accounts?${sp}`);
    },
    enabled: !!orgId,
    ...options,
  });
}

export function useFinanceBankAccount(
  orgId: string | undefined,
  accountId: string | undefined,
  options?: Omit<UseQueryOptions<Record<string, unknown> | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.financeBankAccount(orgId ?? "", accountId ?? ""),
    queryFn: () =>
      orgId && accountId
        ? fetcherData<Record<string, unknown>>(`${API}/orgs/${orgId}/finance/bank-accounts/${accountId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!accountId,
    ...options,
  });
}
