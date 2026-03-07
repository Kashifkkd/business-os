"use client";

import { useInfiniteQuery, type UseInfiniteQueryOptions } from "@tanstack/react-query";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";
import type { ActivityLogRow } from "@/app/api/orgs/[orgId]/logs/route";

export type GetLogsResult = {
  items: ActivityLogRow[];
  nextCursor?: string;
};

export type LogsParams = {
  from?: string;
  to?: string;
  action?: string;
  entity_type?: string;
  user_id?: string;
  limit?: number;
};

export function useLogsInfinite(
  orgId: string | undefined,
  params: LogsParams = {},
  options?: Omit<
    UseInfiniteQueryOptions<GetLogsResult, Error, GetLogsResult, GetLogsResult, ReturnType<typeof queryKeys.logs>>,
    "queryKey" | "queryFn"
  >
) {
  const { from, to, action, entity_type, user_id, limit = 20 } = params;

  return useInfiniteQuery({
    queryKey: queryKeys.logs(orgId ?? "", params),
    queryFn: ({ pageParam }: { pageParam?: string }) => {
      if (!orgId) return Promise.resolve({ items: [], nextCursor: undefined });
      const sp = new URLSearchParams();
      if (pageParam) sp.set("cursor", pageParam);
      if (limit !== 20) sp.set("limit", String(limit));
      if (from) sp.set("from", from);
      if (to) sp.set("to", to);
      if (action) sp.set("action", action);
      if (entity_type) sp.set("entity_type", entity_type);
      if (user_id) sp.set("user_id", user_id);
      const q = sp.toString();
      return fetcherData<GetLogsResult>(`${API}/orgs/${orgId}/logs${q ? `?${q}` : ""}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!orgId,
    ...options,
  });
}
