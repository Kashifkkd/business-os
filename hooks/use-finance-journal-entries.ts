"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { GetJournalEntriesResult } from "@/lib/supabase/queries";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export function useFinanceJournalEntries(
  orgId: string | undefined,
  params: { page: number; pageSize: number; status?: string; from_date?: string; to_date?: string },
  options?: Omit<UseQueryOptions<GetJournalEntriesResult>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["orgs", orgId, "finance", "journal-entries", params.page, params.pageSize, params.status ?? "", params.from_date ?? "", params.to_date ?? ""],
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: params.page, pageSize: params.pageSize });
      const sp = new URLSearchParams();
      sp.set("page", String(params.page));
      sp.set("pageSize", String(params.pageSize));
      if (params.status) sp.set("status", params.status);
      if (params.from_date) sp.set("from_date", params.from_date);
      if (params.to_date) sp.set("to_date", params.to_date);
      return fetcherData<GetJournalEntriesResult>(`${API}/orgs/${orgId}/finance/journal-entries?${sp}`);
    },
    enabled: !!orgId,
    ...options,
  });
}

export function useFinanceJournalEntry(
  orgId: string | undefined,
  entryId: string | undefined,
  options?: Omit<UseQueryOptions<Record<string, unknown> | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.financeJournalEntry(orgId ?? "", entryId ?? ""),
    queryFn: () =>
      orgId && entryId
        ? fetcherData<Record<string, unknown>>(`${API}/orgs/${orgId}/finance/journal-entries/${entryId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!entryId,
    ...options,
  });
}
