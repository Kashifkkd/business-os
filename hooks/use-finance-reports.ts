"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export function useFinanceReportTrialBalance(
  orgId: string | undefined,
  fromDate: string,
  toDate: string,
  options?: Omit<UseQueryOptions<{ from_date: string; to_date: string; rows: unknown[] }>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.financeReportTrialBalance(orgId ?? "", fromDate, toDate),
    queryFn: () =>
      orgId
        ? fetcherData<{ from_date: string; to_date: string; rows: unknown[] }>(
            `${API}/orgs/${orgId}/finance/reports/trial-balance?from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}`
          )
        : Promise.resolve({ from_date: fromDate, to_date: toDate, rows: [] }),
    enabled: !!orgId && !!fromDate && !!toDate,
    ...options,
  });
}

export function useFinanceReportPnL(
  orgId: string | undefined,
  fromDate: string,
  toDate: string,
  options?: Omit<UseQueryOptions<Record<string, unknown>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.financeReportPnL(orgId ?? "", fromDate, toDate),
    queryFn: () =>
      orgId
        ? fetcherData<Record<string, unknown>>(
            `${API}/orgs/${orgId}/finance/reports/profit-and-loss?from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}`
          )
        : Promise.resolve({}),
    enabled: !!orgId && !!fromDate && !!toDate,
    ...options,
  });
}

export function useFinanceReportBalanceSheet(
  orgId: string | undefined,
  asOfDate: string,
  options?: Omit<UseQueryOptions<Record<string, unknown>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.financeReportBalanceSheet(orgId ?? "", asOfDate),
    queryFn: () =>
      orgId
        ? fetcherData<Record<string, unknown>>(
            `${API}/orgs/${orgId}/finance/reports/balance-sheet?as_of=${encodeURIComponent(asOfDate)}`
          )
        : Promise.resolve({}),
    enabled: !!orgId && !!asOfDate,
    ...options,
  });
}

export function useFinanceReportCashFlow(
  orgId: string | undefined,
  fromDate: string,
  toDate: string,
  options?: Omit<UseQueryOptions<Record<string, unknown>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.financeReportCashFlow(orgId ?? "", fromDate, toDate),
    queryFn: () =>
      orgId
        ? fetcherData<Record<string, unknown>>(
            `${API}/orgs/${orgId}/finance/reports/cash-flow?from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}`
          )
        : Promise.resolve({}),
    enabled: !!orgId && !!fromDate && !!toDate,
    ...options,
  });
}
