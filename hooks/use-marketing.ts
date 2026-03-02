"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type {
  MarketingCampaign,
  MarketingSegment,
  MarketingTemplate,
  MarketingJourney,
} from "@/lib/supabase/types";
import { API, fetcherData, queryKeys } from "@/hooks/use-api";

export interface GetMarketingCampaignsResult {
  items: MarketingCampaign[];
  total: number;
  page: number;
  pageSize: number;
}

export type UseMarketingCampaignsParams = {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  channel?: string;
  sortBy?: string;
  order?: string;
};

export function useMarketingCampaigns(
  orgId: string | undefined,
  params: UseMarketingCampaignsParams,
  options?: Omit<UseQueryOptions<GetMarketingCampaignsResult>, "queryKey" | "queryFn">
) {
  const { page, pageSize, search, status, channel, sortBy = "created_at", order = "desc" } = params;

  return useQuery({
    queryKey: ["orgs", orgId, "marketing", "campaigns", { page, pageSize, search, status, channel, sortBy, order }],
    queryFn: () => {
      if (!orgId) {
        return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 10 });
      }
      const sp = new URLSearchParams();
      if (page > 1) sp.set("page", String(page));
      if (pageSize !== 10) sp.set("pageSize", String(pageSize));
      if (search) sp.set("search", search);
      if (status) sp.set("status", status);
      if (channel) sp.set("channel", channel);
      if (sortBy && sortBy !== "created_at") sp.set("sortBy", sortBy);
      if (order && order !== "desc") sp.set("order", order);
      const q = sp.toString();
      return fetcherData<GetMarketingCampaignsResult>(
        `${API}/orgs/${orgId}/marketing/campaigns${q ? `?${q}` : ""}`
      );
    },
    enabled: !!orgId,
    ...options,
  });
}

export function useMarketingCampaign(
  orgId: string | undefined,
  campaignId: string | undefined,
  options?: Omit<UseQueryOptions<MarketingCampaign | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["orgs", orgId, "marketing", "campaign", campaignId],
    queryFn: () =>
      orgId && campaignId
        ? fetcherData<MarketingCampaign>(`${API}/orgs/${orgId}/marketing/campaigns/${campaignId}`).catch(
            () => null
          )
        : Promise.resolve(null),
    enabled: !!orgId && !!campaignId,
    ...options,
  });
}

export type CreateMarketingCampaignPayload = {
  name: string;
  description?: string | null;
  objective?: string | null;
  status?: string | null;
  primary_channel?: string | null;
  budget_amount?: number | null;
  budget_currency?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  primary_segment_id?: string | null;
  owner_id?: string | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown>;
};

export type UpdateMarketingCampaignPayload = Partial<CreateMarketingCampaignPayload>;

export function useCreateMarketingCampaign(
  orgId: string,
  options?: UseMutationOptions<MarketingCampaign, Error, CreateMarketingCampaignPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMarketingCampaignPayload) =>
      fetcherData<MarketingCampaign>(`${API}/orgs/${orgId}/marketing/campaigns`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "marketing", "campaigns"] });
    },
    ...options,
  });
}

export function useUpdateMarketingCampaign(
  orgId: string,
  campaignId: string,
  options?: UseMutationOptions<MarketingCampaign, Error, UpdateMarketingCampaignPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMarketingCampaignPayload) =>
      fetcherData<MarketingCampaign>(`${API}/orgs/${orgId}/marketing/campaigns/${campaignId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      qc.setQueryData(["orgs", orgId, "marketing", "campaign", campaignId], data);
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "marketing", "campaigns"] });
    },
    ...options,
  });
}

export function useDeleteMarketingCampaign(
  orgId: string,
  options?: UseMutationOptions<{ deleted: true }, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: string) =>
      fetcherData<{ deleted: true }>(`${API}/orgs/${orgId}/marketing/campaigns/${campaignId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "marketing", "campaigns"] });
    },
    ...options,
  });
}

export interface GetMarketingSegmentsResult {
  items: MarketingSegment[];
  total: number;
  page: number;
  pageSize: number;
}

export function useMarketingSegment(
  orgId: string | undefined,
  segmentId: string | undefined,
  options?: Omit<UseQueryOptions<MarketingSegment | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["orgs", orgId, "marketing", "segment", segmentId],
    queryFn: () =>
      orgId && segmentId
        ? fetcherData<MarketingSegment>(
            `${API}/orgs/${orgId}/marketing/segments/${segmentId}`
          ).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!segmentId,
    ...options,
  });
}

export type UseMarketingSegmentsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export function useMarketingSegments(
  orgId: string | undefined,
  params?: UseMarketingSegmentsParams,
  options?: Omit<UseQueryOptions<GetMarketingSegmentsResult>, "queryKey" | "queryFn">
) {
  const { page = 1, pageSize = 10, search } = params ?? {};
  return useQuery({
    queryKey: ["orgs", orgId, "marketing", "segments", { page, pageSize, search }],
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 10 });
      const sp = new URLSearchParams();
      if (page > 1) sp.set("page", String(page));
      if (pageSize !== 10) sp.set("pageSize", String(pageSize));
      if (search) sp.set("search", search);
      const q = sp.toString();
      return fetcherData<GetMarketingSegmentsResult>(
        `${API}/orgs/${orgId}/marketing/segments${q ? `?${q}` : ""}`
      );
    },
    enabled: !!orgId,
    ...options,
  });
}

export type UpsertMarketingSegmentPayload = {
  id?: string;
  name: string;
  description?: string | null;
  definition: Record<string, unknown>;
};

export function useUpsertMarketingSegment(
  orgId: string,
  options?: UseMutationOptions<MarketingSegment, Error, UpsertMarketingSegmentPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertMarketingSegmentPayload) =>
      fetcherData<MarketingSegment>(`${API}/orgs/${orgId}/marketing/segments`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "marketing", "segments"] });
    },
    ...options,
  });
}

export interface GetMarketingTemplatesResult {
  items: MarketingTemplate[];
  total: number;
  page: number;
  pageSize: number;
}

export function useMarketingTemplate(
  orgId: string | undefined,
  templateId: string | undefined,
  options?: Omit<UseQueryOptions<MarketingTemplate | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["orgs", orgId, "marketing", "template", templateId],
    queryFn: () =>
      orgId && templateId
        ? fetcherData<MarketingTemplate>(
            `${API}/orgs/${orgId}/marketing/templates/${templateId}`
          ).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!templateId,
    ...options,
  });
}

export type UseMarketingTemplatesParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  channel?: string;
};

export function useMarketingTemplates(
  orgId: string | undefined,
  params?: UseMarketingTemplatesParams,
  options?: Omit<UseQueryOptions<GetMarketingTemplatesResult>, "queryKey" | "queryFn">
) {
  const { page = 1, pageSize = 10, search, channel } = params ?? {};
  return useQuery({
    queryKey: ["orgs", orgId, "marketing", "templates", { page, pageSize, search, channel }],
    queryFn: () => {
      if (!orgId) {
        return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 10 });
      }
      const sp = new URLSearchParams();
      if (page > 1) sp.set("page", String(page));
      if (pageSize !== 10) sp.set("pageSize", String(pageSize));
      if (search) sp.set("search", search);
      if (channel) sp.set("channel", channel);
      const q = sp.toString();
      return fetcherData<GetMarketingTemplatesResult>(
        `${API}/orgs/${orgId}/marketing/templates${q ? `?${q}` : ""}`
      );
    },
    enabled: !!orgId,
    ...options,
  });
}

export type UpsertMarketingTemplatePayload = {
  id?: string;
  name: string;
  description?: string | null;
  channel: string;
  subject?: string | null;
  body: string;
  variables?: string[] | null;
  is_active?: boolean;
};

export function useUpsertMarketingTemplate(
  orgId: string,
  options?: UseMutationOptions<MarketingTemplate, Error, UpsertMarketingTemplatePayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertMarketingTemplatePayload) =>
      fetcherData<MarketingTemplate>(`${API}/orgs/${orgId}/marketing/templates`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "marketing", "templates"] });
    },
    ...options,
  });
}

export interface GetMarketingJourneysResult {
  items: MarketingJourney[];
  total: number;
  page: number;
  pageSize: number;
}

export function useMarketingJourney(
  orgId: string | undefined,
  journeyId: string | undefined,
  options?: Omit<UseQueryOptions<MarketingJourney | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["orgs", orgId, "marketing", "journey", journeyId],
    queryFn: () =>
      orgId && journeyId
        ? fetcherData<MarketingJourney>(
            `${API}/orgs/${orgId}/marketing/journeys/${journeyId}`
          ).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!journeyId,
    ...options,
  });
}

export function useMarketingJourneys(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<GetMarketingJourneysResult>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["orgs", orgId, "marketing", "journeys"],
    queryFn: () =>
      orgId
        ? fetcherData<GetMarketingJourneysResult>(`${API}/orgs/${orgId}/marketing/journeys`)
        : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 10 }),
    enabled: !!orgId,
    ...options,
  });
}

export type UpsertMarketingJourneyPayload = {
  id?: string;
  name: string;
  description?: string | null;
  status?: string | null;
  trigger_type: string;
  trigger_config?: Record<string, unknown>;
  steps: unknown[];
};

export function useUpsertMarketingJourney(
  orgId: string,
  options?: UseMutationOptions<MarketingJourney, Error, UpsertMarketingJourneyPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertMarketingJourneyPayload) =>
      fetcherData<MarketingJourney>(`${API}/orgs/${orgId}/marketing/journeys`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "marketing", "journeys"] });
    },
    ...options,
  });
}

export interface MarketingAnalyticsSummary {
  totalSends: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalUnsubscribed: number;
  byChannel: {
    channel: string;
    sends: number;
    delivered: number;
    opened: number;
    clicked: number;
  }[];
  byCampaign: {
    campaign_id: string | null;
    campaign_name: string | null;
    sends: number;
    opened: number;
    clicked: number;
  }[];
}

export function useMarketingAnalyticsSummary(
  orgId: string | undefined,
  days = 30,
  options?: Omit<UseQueryOptions<MarketingAnalyticsSummary>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["orgs", orgId, "marketing", "analytics", { days }],
    queryFn: () =>
      orgId
        ? fetcherData<MarketingAnalyticsSummary>(
            `${API}/orgs/${orgId}/marketing/analytics?days=${encodeURIComponent(String(days))}`
          )
        : Promise.resolve({
            totalSends: 0,
            totalDelivered: 0,
            totalOpened: 0,
            totalClicked: 0,
            totalBounced: 0,
            totalUnsubscribed: 0,
            byChannel: [],
            byCampaign: [],
          }),
    enabled: !!orgId,
    ...options,
  });
}

