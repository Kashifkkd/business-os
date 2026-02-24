"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export interface CafeDashboardStats {
  menuItemsCount: number;
  categoriesCount: number;
  subcategoriesCount: number;
  discountsCount: number;
  ordersCount: number;
  totalRevenueCents: number;
  ordersByStatus: Record<string, number>;
  ordersLast7Days: { date: string; count: number }[];
  revenueLast7Days: { date: string; totalCents: number }[];
}

export interface CafeInsightsData {
  itemsByCategory: { categoryName: string; count: number }[];
  ordersOverTime: { date: string; count: number }[];
  revenueOverTime: { date: string; count: number; totalCents?: number }[];
}

const defaultDashboard: CafeDashboardStats = {
  menuItemsCount: 0,
  categoriesCount: 0,
  subcategoriesCount: 0,
  discountsCount: 0,
  ordersCount: 0,
  totalRevenueCents: 0,
  ordersByStatus: {},
  ordersLast7Days: [],
  revenueLast7Days: [],
};

const defaultInsights: CafeInsightsData = {
  itemsByCategory: [],
  ordersOverTime: [],
  revenueOverTime: [],
};

export function useCafeDashboard(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<CafeDashboardStats>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.cafeDashboard(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<CafeDashboardStats>(`${API}/orgs/${orgId}/cafe/dashboard`)
        : Promise.resolve(defaultDashboard),
    enabled: !!orgId,
    ...options,
  });
}

export function useCafeInsights(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<CafeInsightsData>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.cafeInsights(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<CafeInsightsData>(`${API}/orgs/${orgId}/cafe/insights`)
        : Promise.resolve(defaultInsights),
    enabled: !!orgId,
    ...options,
  });
}
