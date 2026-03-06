"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { ActivityCall, ActivityMeeting } from "@/lib/supabase/types";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

// ——— Calls ———

export interface GetActivityCallsResult {
  items: ActivityCall[];
  total: number;
  page: number;
  pageSize: number;
}

export type ActivityCallsParams = {
  page: number;
  pageSize: number;
  search?: string;
  leadId?: string;
  dealId?: string;
  dateFrom?: string;
  dateTo?: string;
  ownerId?: string;
};

export function useActivityCalls(
  orgId: string | undefined,
  params: ActivityCallsParams,
  options?: Omit<UseQueryOptions<GetActivityCallsResult>, "queryKey" | "queryFn">
) {
  const {
    page,
    pageSize,
    search,
    leadId,
    dealId,
    dateFrom,
    dateTo,
    ownerId,
  } = params;

  return useQuery({
    queryKey: queryKeys.activityCalls(orgId ?? "", {
      page,
      pageSize,
      search,
      leadId,
      dealId,
      dateFrom,
      dateTo,
      ownerId,
    }),
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 10 });
      const sp = new URLSearchParams();
      if (page > 1) sp.set("page", String(page));
      if (pageSize !== 10) sp.set("pageSize", String(pageSize));
      if (search) sp.set("search", search);
      if (leadId) sp.set("leadId", leadId);
      if (dealId) sp.set("dealId", dealId);
      if (dateFrom) sp.set("dateFrom", dateFrom);
      if (dateTo) sp.set("dateTo", dateTo);
      if (ownerId) sp.set("ownerId", ownerId);
      const q = sp.toString();
      return fetcherData<GetActivityCallsResult>(
        `${API}/orgs/${orgId}/activities/calls${q ? `?${q}` : ""}`
      );
    },
    enabled: !!orgId,
    ...options,
  });
}

export function useActivityCall(
  orgId: string | undefined,
  callId: string | undefined,
  options?: Omit<UseQueryOptions<ActivityCall | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.activityCall(orgId ?? "", callId ?? ""),
    queryFn: () =>
      orgId && callId
        ? fetcherData<ActivityCall>(
            `${API}/orgs/${orgId}/activities/calls/${callId}`
          ).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!callId,
    ...options,
  });
}

export type CreateActivityCallPayload = {
  subject?: string | null;
  description?: string | null;
  call_type?: string;
  call_status?: string;
  call_start_time: string;
  duration_seconds?: number | null;
  call_result?: string | null;
  call_agenda?: string | null;
  call_purpose?: string | null;
  lead_id?: string | null;
  deal_id?: string | null;
  owner_id?: string | null;
};

export type UpdateActivityCallPayload = Partial<CreateActivityCallPayload>;

export function useCreateActivityCall(
  orgId: string,
  options?: UseMutationOptions<ActivityCall, Error, CreateActivityCallPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateActivityCallPayload) =>
      fetcherData<ActivityCall>(`${API}/orgs/${orgId}/activities/calls`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "activities"] });
    },
    ...options,
  });
}

export function useUpdateActivityCall(
  orgId: string,
  callId: string,
  options?: UseMutationOptions<ActivityCall, Error, UpdateActivityCallPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateActivityCallPayload) =>
      fetcherData<ActivityCall>(
        `${API}/orgs/${orgId}/activities/calls/${callId}`,
        { method: "PATCH", body: JSON.stringify(data) }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "activities"] });
      qc.invalidateQueries({ queryKey: queryKeys.activityCall(orgId, callId) });
    },
    ...options,
  });
}

export function useDeleteActivityCall(
  orgId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (callId: string) =>
      fetcherData<{ deleted: boolean }>(
        `${API}/orgs/${orgId}/activities/calls/${callId}`,
        { method: "DELETE" }
      ).then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "activities"] });
    },
    ...options,
  });
}

// ——— Meetings ———

export interface GetActivityMeetingsResult {
  items: ActivityMeeting[];
  total: number;
  page: number;
  pageSize: number;
}

export type ActivityMeetingsParams = {
  page: number;
  pageSize: number;
  search?: string;
  leadId?: string;
  dealId?: string;
  dateFrom?: string;
  dateTo?: string;
  ownerId?: string;
};

export function useActivityMeetings(
  orgId: string | undefined,
  params: ActivityMeetingsParams,
  options?: Omit<UseQueryOptions<GetActivityMeetingsResult>, "queryKey" | "queryFn">
) {
  const {
    page,
    pageSize,
    search,
    leadId,
    dealId,
    dateFrom,
    dateTo,
    ownerId,
  } = params;

  return useQuery({
    queryKey: queryKeys.activityMeetings(orgId ?? "", {
      page,
      pageSize,
      search,
      leadId,
      dealId,
      dateFrom,
      dateTo,
      ownerId,
    }),
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 10 });
      const sp = new URLSearchParams();
      if (page > 1) sp.set("page", String(page));
      if (pageSize !== 10) sp.set("pageSize", String(pageSize));
      if (search) sp.set("search", search);
      if (leadId) sp.set("leadId", leadId);
      if (dealId) sp.set("dealId", dealId);
      if (dateFrom) sp.set("dateFrom", dateFrom);
      if (dateTo) sp.set("dateTo", dateTo);
      if (ownerId) sp.set("ownerId", ownerId);
      const q = sp.toString();
      return fetcherData<GetActivityMeetingsResult>(
        `${API}/orgs/${orgId}/activities/meetings${q ? `?${q}` : ""}`
      );
    },
    enabled: !!orgId,
    ...options,
  });
}

export function useActivityMeeting(
  orgId: string | undefined,
  meetingId: string | undefined,
  options?: Omit<UseQueryOptions<ActivityMeeting | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.activityMeeting(orgId ?? "", meetingId ?? ""),
    queryFn: () =>
      orgId && meetingId
        ? fetcherData<ActivityMeeting>(
            `${API}/orgs/${orgId}/activities/meetings/${meetingId}`
          ).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!meetingId,
    ...options,
  });
}

export type CreateActivityMeetingPayload = {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  venue?: string | null;
  all_day?: boolean;
  participant_ids?: string[];
  lead_id?: string | null;
  deal_id?: string | null;
  owner_id?: string | null;
};

export type UpdateActivityMeetingPayload = Partial<CreateActivityMeetingPayload>;

export function useCreateActivityMeeting(
  orgId: string,
  options?: UseMutationOptions<ActivityMeeting, Error, CreateActivityMeetingPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateActivityMeetingPayload) =>
      fetcherData<ActivityMeeting>(`${API}/orgs/${orgId}/activities/meetings`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "activities"] });
    },
    ...options,
  });
}

export function useUpdateActivityMeeting(
  orgId: string,
  meetingId: string,
  options?: UseMutationOptions<ActivityMeeting, Error, UpdateActivityMeetingPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateActivityMeetingPayload) =>
      fetcherData<ActivityMeeting>(
        `${API}/orgs/${orgId}/activities/meetings/${meetingId}`,
        { method: "PATCH", body: JSON.stringify(data) }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "activities"] });
      qc.invalidateQueries({ queryKey: queryKeys.activityMeeting(orgId, meetingId) });
    },
    ...options,
  });
}

export function useDeleteActivityMeeting(
  orgId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: string) =>
      fetcherData<{ deleted: boolean }>(
        `${API}/orgs/${orgId}/activities/meetings/${meetingId}`,
        { method: "DELETE" }
      ).then(() => undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "activities"] });
    },
    ...options,
  });
}
