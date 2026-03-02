"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { InventoryAnalytics } from "@/lib/supabase/queries";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export function useInventoryAnalytics(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<InventoryAnalytics>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.inventoryAnalytics(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<InventoryAnalytics>(`${API}/orgs/${orgId}/inventory/analytics`)
        : Promise.resolve({
            total_items: 0,
            low_stock_count: 0,
            total_stock_value: 0,
            recent_movements: [],
            low_stock_items: [],
          }),
    enabled: !!orgId,
    ...options,
  });
}
