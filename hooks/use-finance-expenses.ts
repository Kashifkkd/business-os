"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { GetExpenseReportsResult } from "@/lib/supabase/queries";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export function useFinanceExpenses(
  orgId: string | undefined,
  params: { page: number; pageSize: number; status?: string },
  options?: Omit<UseQueryOptions<GetExpenseReportsResult>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.financeExpenses(orgId ?? "", params),
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: params.page, pageSize: params.pageSize });
      const sp = new URLSearchParams();
      sp.set("page", String(params.page));
      sp.set("pageSize", String(params.pageSize));
      if (params.status) sp.set("status", params.status);
      return fetcherData<GetExpenseReportsResult>(`${API}/orgs/${orgId}/finance/expenses?${sp}`);
    },
    enabled: !!orgId,
    ...options,
  });
}

export function useFinanceExpense(
  orgId: string | undefined,
  expenseId: string | undefined,
  options?: Omit<UseQueryOptions<Record<string, unknown> | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.financeExpense(orgId ?? "", expenseId ?? ""),
    queryFn: () =>
      orgId && expenseId
        ? fetcherData<Record<string, unknown>>(`${API}/orgs/${orgId}/finance/expenses/${expenseId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!expenseId,
    ...options,
  });
}
