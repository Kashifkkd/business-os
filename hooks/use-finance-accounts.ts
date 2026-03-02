"use client";

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from "@tanstack/react-query";
import type { Account } from "@/lib/supabase/types";
import type { GetFinanceAccountsResult } from "@/lib/supabase/queries";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export function useFinanceAccounts(
  orgId: string | undefined,
  params: { page: number; pageSize: number; search?: string; type?: string; is_active?: boolean },
  options?: Omit<UseQueryOptions<GetFinanceAccountsResult>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.financeAccounts(orgId ?? "", { ...params, type: params.type }),
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: params.page, pageSize: params.pageSize });
      const sp = new URLSearchParams();
      sp.set("page", String(params.page));
      sp.set("pageSize", String(params.pageSize));
      if (params.search) sp.set("search", params.search);
      if (params.type) sp.set("type", params.type);
      if (params.is_active !== undefined) sp.set("is_active", String(params.is_active));
      return fetcherData<GetFinanceAccountsResult>(`${API}/orgs/${orgId}/finance/accounts?${sp}`);
    },
    enabled: !!orgId,
    ...options,
  });
}

export function useFinanceAccount(
  orgId: string | undefined,
  accountId: string | undefined,
  options?: Omit<UseQueryOptions<Account | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.financeAccount(orgId ?? "", accountId ?? ""),
    queryFn: () =>
      orgId && accountId
        ? fetcherData<Account>(`${API}/orgs/${orgId}/finance/accounts/${accountId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!accountId,
    ...options,
  });
}

export type CreateFinanceAccountPayload = {
  code: string;
  name: string;
  type: string;
  subtype?: string | null;
  is_active?: boolean;
  parent_account_id?: string | null;
  tax_rate_id?: string | null;
};

export function useCreateFinanceAccount(
  orgId: string,
  options?: UseMutationOptions<Account, Error, CreateFinanceAccountPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFinanceAccountPayload) =>
      fetcherData<Account>(`${API}/orgs/${orgId}/finance/accounts`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "finance", "accounts"] });
    },
    ...options,
  });
}

export function useUpdateFinanceAccount(
  orgId: string,
  accountId: string,
  options?: UseMutationOptions<Account, Error, Partial<CreateFinanceAccountPayload>>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateFinanceAccountPayload>) =>
      fetcherData<Account>(`${API}/orgs/${orgId}/finance/accounts/${accountId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "finance", "accounts"] });
      qc.invalidateQueries({ queryKey: queryKeys.financeAccount(orgId, accountId) });
    },
    ...options,
  });
}

export function useDeleteFinanceAccount(orgId: string, options?: UseMutationOptions<void, Error, string>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      fetch(`${API}/orgs/${orgId}/finance/accounts/${accountId}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete");
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "finance", "accounts"] });
    },
    ...options,
  });
}
