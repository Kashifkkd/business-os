"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Deal, DealActivity, SalesPipelineStage } from "@/lib/supabase/types";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export interface GetDealsResult {
  items: Deal[];
  total: number;
  page: number;
  pageSize: number;
}

export type CreateDealPayload = {
  name: string;
  lead_id?: string | null;
  stage_id: string;
  owner_id?: string | null;
  value?: number;
  actual_value?: number | null;
  probability?: number | null;
  expected_close_date?: string | null;
  close_date?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
};

export type UpdateDealPayload = Partial<{
  name: string;
  lead_id: string | null;
  stage_id: string;
  owner_id: string | null;
  value: number;
  actual_value: number | null;
  probability: number | null;
  expected_close_date: string | null;
  close_date: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
}>;

export type UseDealsParams = {
  page: number;
  pageSize: number;
  search?: string;
  stage_id?: string;
  owner_id?: string;
  lead_id?: string;
  created_after?: string;
  created_before?: string;
  sortBy?: string;
  order?: string;
};

export interface SalesStatsResult {
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalPipelineValue: number;
  wonValue: number;
  winRate: number | null;
  newThisWeek: number;
  byStage: { stage_id: string; stage_name: string; count: number; value: number }[];
}

export interface SalesForecastResult {
  byStage: { stage_id: string; stage_name: string; count: number; value: number; weightedValue: number }[];
  totalPipelineValue: number;
  weightedPipelineValue: number;
  expectedCloseByMonth: { month: string; count: number; value: number }[];
}

export interface SalesAnalyticsResult {
  winRate: number | null;
  lossRate: number | null;
  avgDealValue: number;
  totalWonValue: number;
  totalLostCount: number;
  stageConversion: { from_stage: string; to_stage: string; count: number }[];
  dealsCreatedByMonth: { month: string; count: number; value: number }[];
  dealsClosedByMonth: { month: string; won: number; lost: number; wonValue: number }[];
}

/** Paginated deals list. */
export function useDeals(
  orgId: string | undefined,
  params: UseDealsParams,
  options?: Omit<UseQueryOptions<GetDealsResult>, "queryKey" | "queryFn">
) {
  const {
    page,
    pageSize,
    search,
    stage_id,
    owner_id,
    lead_id,
    created_after,
    created_before,
    sortBy = "created_at",
    order = "desc",
  } = params;
  return useQuery({
    queryKey: queryKeys.deals(orgId ?? "", {
      page,
      pageSize,
      search,
      stage_id,
      owner_id,
      lead_id,
      created_after,
      created_before,
      sortBy,
      order,
    }),
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 10 });
      const sp = new URLSearchParams();
      if (page > 1) sp.set("page", String(page));
      if (pageSize !== 10) sp.set("pageSize", String(pageSize));
      if (search) sp.set("search", search);
      if (stage_id) sp.set("stage_id", stage_id);
      if (owner_id) sp.set("owner_id", owner_id);
      if (lead_id) sp.set("lead_id", lead_id);
      if (created_after) sp.set("created_after", created_after);
      if (created_before) sp.set("created_before", created_before);
      if (sortBy && sortBy !== "created_at") sp.set("sortBy", sortBy);
      if (order && order !== "desc") sp.set("order", order);
      const q = sp.toString();
      return fetcherData<GetDealsResult>(`${API}/orgs/${orgId}/sales/deals${q ? `?${q}` : ""}`);
    },
    enabled: !!orgId,
    ...options,
  });
}

/** Single deal (for detail/edit). */
export function useDeal(
  orgId: string | undefined,
  dealId: string | undefined,
  options?: Omit<UseQueryOptions<Deal | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.deal(orgId ?? "", dealId ?? ""),
    queryFn: () =>
      orgId && dealId
        ? fetcherData<Deal>(`${API}/orgs/${orgId}/sales/deals/${dealId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!dealId,
    ...options,
  });
}

/** Pipeline stages for the org. */
export function usePipelineStages(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<SalesPipelineStage[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.salesPipelineStages(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<SalesPipelineStage[]>(`${API}/orgs/${orgId}/sales/pipeline-stages`)
        : Promise.resolve([]),
    enabled: !!orgId,
    ...options,
  });
}

/** Create a deal. Invalidates deals list and stats. */
export function useCreateDeal(
  orgId: string,
  options?: UseMutationOptions<Deal, Error, CreateDealPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDealPayload) =>
      fetcherData<Deal>(`${API}/orgs/${orgId}/sales/deals`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "sales"] });
    },
    ...options,
  });
}

/** Update a deal. Invalidates deal and list. */
export function useUpdateDeal(
  orgId: string,
  dealId: string,
  options?: UseMutationOptions<Deal, Error, UpdateDealPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateDealPayload) =>
      fetcherData<Deal>(`${API}/orgs/${orgId}/sales/deals/${dealId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.deal(orgId, dealId), data);
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "sales"] });
    },
    ...options,
  });
}

/** Update any deal by id (e.g. for pipeline drag-and-drop). */
export function useUpdateDealById(
  orgId: string,
  options?: UseMutationOptions<Deal, Error, { dealId: string; data: UpdateDealPayload }>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dealId, data }: { dealId: string; data: UpdateDealPayload }) =>
      fetcherData<Deal>(`${API}/orgs/${orgId}/sales/deals/${dealId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.deal(orgId, data.id), data);
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "sales"] });
    },
    ...options,
  });
}

/** Delete a deal. Invalidates deals list. */
export function useDeleteDeal(
  orgId: string,
  options?: UseMutationOptions<{ deleted: true }, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dealId: string) =>
      fetcherData<{ deleted: true }>(`${API}/orgs/${orgId}/sales/deals/${dealId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "sales"] });
    },
    ...options,
  });
}

/** Deal activities (timeline). */
export function useDealActivities(
  orgId: string | undefined,
  dealId: string | undefined,
  options?: Omit<UseQueryOptions<DealActivity[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.dealActivities(orgId ?? "", dealId ?? ""),
    queryFn: () =>
      orgId && dealId
        ? fetcherData<DealActivity[]>(`${API}/orgs/${orgId}/sales/deals/${dealId}/activities`)
        : Promise.resolve([]),
    enabled: !!orgId && !!dealId,
    ...options,
  });
}

/** Create a deal activity (e.g. note). Invalidates activities for that deal. */
export function useCreateDealActivity(
  orgId: string,
  dealId: string,
  options?: UseMutationOptions<DealActivity, Error, { type?: string; content?: string | null }>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { type?: string; content?: string | null }) =>
      fetcherData<DealActivity>(`${API}/orgs/${orgId}/sales/deals/${dealId}/activities`, {
        method: "POST",
        body: JSON.stringify({ type: body.type ?? "note", content: body.content ?? null }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.dealActivities(orgId, dealId) });
    },
    ...options,
  });
}

/** Sales stats for overview/insights. */
export function useSalesStats(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<SalesStatsResult>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.salesStats(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<SalesStatsResult>(`${API}/orgs/${orgId}/sales/stats`)
        : Promise.resolve({
            totalDeals: 0,
            openDeals: 0,
            wonDeals: 0,
            lostDeals: 0,
            totalPipelineValue: 0,
            wonValue: 0,
            winRate: null,
            newThisWeek: 0,
            byStage: [],
          }),
    enabled: !!orgId,
    ...options,
  });
}

/** Sales forecast (weighted pipeline, by month). */
export function useSalesForecast(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<SalesForecastResult>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.salesForecast(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<SalesForecastResult>(`${API}/orgs/${orgId}/sales/forecast`)
        : Promise.resolve({
            byStage: [],
            totalPipelineValue: 0,
            weightedPipelineValue: 0,
            expectedCloseByMonth: [],
          }),
    enabled: !!orgId,
    ...options,
  });
}

/** Sales analytics (win rate, velocity, etc.). */
export function useSalesAnalytics(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<SalesAnalyticsResult>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.salesAnalytics(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<SalesAnalyticsResult>(`${API}/orgs/${orgId}/sales/analytics`)
        : Promise.resolve({
            winRate: null,
            lossRate: null,
            avgDealValue: 0,
            totalWonValue: 0,
            totalLostCount: 0,
            stageConversion: [],
            dealsCreatedByMonth: [],
            dealsClosedByMonth: [],
          }),
    enabled: !!orgId,
    ...options,
  });
}

/** Convert a lead to a deal. Invalidates deals list. */
export function useConvertLeadToDeal(
  orgId: string,
  options?: UseMutationOptions<Deal, Error, { lead_id: string; name?: string; value?: number; stage_id?: string }>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { lead_id: string; name?: string; value?: number; stage_id?: string }) =>
      fetcherData<Deal>(`${API}/orgs/${orgId}/sales/convert-lead`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "sales"] });
    },
    ...options,
  });
}
