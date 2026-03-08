"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Lead, LeadActivity } from "@/lib/supabase/types";
import type { LeadSourceItem } from "@/lib/lead-sources";
import type { LeadStageItem } from "@/lib/lead-stages";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export interface GetLeadsResult {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
}

export type CreateLeadPayload = {
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company_id?: string | null;
  source_id?: string | null;
  stage_id?: string | null;
  job_title_id?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  assignee_ids?: string[];
};

export type UpdateLeadPayload = Partial<{
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_id: string | null;
  source_id: string | null;
  stage_id: string;
  job_title_id: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  assignee_ids: string[];
}>;

export type UseLeadsParams = {
  page: number;
  pageSize: number;
  search?: string;
  stage?: string;
  source?: string;
  created_after?: string;
  created_before?: string;
  sortBy?: string;
  order?: string;
};

/** Paginated leads list. */
export function useLeads(
  orgId: string | undefined,
  params: UseLeadsParams,
  options?: Omit<UseQueryOptions<GetLeadsResult>, "queryKey" | "queryFn">
) {
  const {
    page,
    pageSize,
    search,
    stage,
    source,
    created_after,
    created_before,
    sortBy = "created_at",
    order = "desc",
  } = params;
  return useQuery({
    queryKey: queryKeys.leads(orgId ?? "", {
      page,
      pageSize,
      search,
      stage,
      source,
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
      if (stage) sp.set("stage", stage);
      if (source) sp.set("source", source);
      if (created_after) sp.set("created_after", created_after);
      if (created_before) sp.set("created_before", created_before);
      if (sortBy && sortBy !== "created_at") sp.set("sortBy", sortBy);
      if (order && order !== "desc") sp.set("order", order);
      const q = sp.toString();
      return fetcherData<GetLeadsResult>(`${API}/orgs/${orgId}/leads${q ? `?${q}` : ""}`);
    },
    enabled: !!orgId,
    ...options,
  });
}

/** Single lead (for detail/edit). */
export function useLead(
  orgId: string | undefined,
  leadId: string | undefined,
  options?: Omit<UseQueryOptions<Lead | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.lead(orgId ?? "", leadId ?? ""),
    queryFn: () =>
      orgId && leadId
        ? fetcherData<Lead>(`${API}/orgs/${orgId}/leads/${leadId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!leadId,
    ...options,
  });
}

/** Create a lead. Invalidates leads list. */
export function useCreateLead(
  orgId: string,
  options?: UseMutationOptions<Lead, Error, CreateLeadPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLeadPayload) =>
      fetcherData<Lead>(`${API}/orgs/${orgId}/leads`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "leads"] });
    },
    ...options,
  });
}

/** Update a lead. Invalidates lead and list. */
export function useUpdateLead(
  orgId: string,
  leadId: string,
  options?: UseMutationOptions<Lead, Error, UpdateLeadPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateLeadPayload) =>
      fetcherData<Lead>(`${API}/orgs/${orgId}/leads/${leadId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.lead(orgId, leadId), data);
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "leads"] });
    },
    ...options,
  });
}

/** Update any lead by id (e.g. for pipeline drag-and-drop). */
export function useUpdateLeadById(
  orgId: string,
  options?: UseMutationOptions<Lead, Error, { leadId: string; data: UpdateLeadPayload }>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: UpdateLeadPayload }) =>
      fetcherData<Lead>(`${API}/orgs/${orgId}/leads/${leadId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.lead(orgId, data.id), data);
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "leads"] });
    },
    ...options,
  });
}

/** Delete a lead. Invalidates leads list. */
export function useDeleteLead(
  orgId: string,
  options?: UseMutationOptions<{ deleted: true }, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) =>
      fetcherData<{ deleted: true }>(`${API}/orgs/${orgId}/leads/${leadId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "leads"] });
    },
    ...options,
  });
}

/** Lead activities (timeline). */
export function useLeadActivities(
  orgId: string | undefined,
  leadId: string | undefined,
  options?: Omit<UseQueryOptions<LeadActivity[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.leadActivities(orgId ?? "", leadId ?? ""),
    queryFn: () =>
      orgId && leadId
        ? fetcherData<LeadActivity[]>(`${API}/orgs/${orgId}/leads/${leadId}/activities`)
        : Promise.resolve([]),
    enabled: !!orgId && !!leadId,
    ...options,
  });
}

/** Create a lead activity (e.g. note). Invalidates activities for that lead. */
export function useCreateLeadActivity(
  orgId: string,
  leadId: string,
  options?: UseMutationOptions<
    LeadActivity,
    Error,
    { type?: string; content?: string | null; metadata?: Record<string, unknown> }
  >
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      type?: string;
      content?: string | null;
      metadata?: Record<string, unknown>;
    }) =>
      fetcherData<LeadActivity>(`${API}/orgs/${orgId}/leads/${leadId}/activities`, {
        method: "POST",
        body: JSON.stringify({
          type: body.type ?? "note",
          content: body.content ?? null,
          metadata: body.metadata ?? {},
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leadActivities(orgId, leadId) });
    },
    ...options,
  });
}

/** Update a lead activity (e.g. note). Invalidates activities for that lead. */
export function useUpdateLeadActivity(
  orgId: string,
  leadId: string,
  options?: UseMutationOptions<
    LeadActivity,
    Error,
    { activityId: string; content?: string | null; metadata?: Record<string, unknown> }
  >
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      activityId,
      content,
      metadata,
    }: {
      activityId: string;
      content?: string | null;
      metadata?: Record<string, unknown>;
    }) =>
      fetcherData<LeadActivity>(
        `${API}/orgs/${orgId}/leads/${leadId}/activities/${activityId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ content: content ?? null, metadata: metadata ?? {} }),
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leadActivities(orgId, leadId) });
    },
    ...options,
  });
}

/** Delete a lead activity (e.g. note). Invalidates activities for that lead. */
export function useDeleteLeadActivity(
  orgId: string,
  leadId: string,
  options?: UseMutationOptions<{ deleted: true }, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (activityId: string) =>
      fetcherData<{ deleted: true }>(
        `${API}/orgs/${orgId}/leads/${leadId}/activities/${activityId}`,
        { method: "DELETE" }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.leadActivities(orgId, leadId) });
    },
    ...options,
  });
}

/** Lead source options for the org (from tenant settings), with optional color per source. */
export function useLeadSources(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<{ sources: LeadSourceItem[] }>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.leadSources(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<{ sources: LeadSourceItem[] }>(`${API}/orgs/${orgId}/leads/sources`).then((r) =>
            r?.sources ? r : { sources: [] }
          )
        : Promise.resolve({ sources: [] }),
    enabled: !!orgId,
    ...options,
  });
}

/** Update lead source options (name + color per source). */
export function useUpdateLeadSources(
  orgId: string,
  options?: UseMutationOptions<{ sources: LeadSourceItem[] }, Error, LeadSourceItem[]>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sources: LeadSourceItem[]) =>
      fetcherData<{ sources: LeadSourceItem[] }>(`${API}/orgs/${orgId}/leads/sources`, {
        method: "PATCH",
        body: JSON.stringify({ sources }),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.leadSources(orgId), data);
    },
    ...options,
  });
}

/** Lead stage options for the org. */
export function useLeadStages(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<{ stages: LeadStageItem[] }>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.leadStages(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<{ stages: LeadStageItem[] }>(`${API}/orgs/${orgId}/leads/stages`).then((r) =>
            r?.stages ? r : { stages: [] }
          )
        : Promise.resolve({ stages: [] }),
    enabled: !!orgId,
    ...options,
  });
}

/** Update lead stages (full replace). */
export function useUpdateLeadStages(
  orgId: string,
  options?: UseMutationOptions<{ stages: LeadStageItem[] }, Error, LeadStageItem[]>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stages: LeadStageItem[]) =>
      fetcherData<{ stages: LeadStageItem[] }>(`${API}/orgs/${orgId}/leads/stages`, {
        method: "PATCH",
        body: JSON.stringify({ stages }),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.leadStages(orgId), data);
    },
    ...options,
  });
}

/** Bulk update lead stage. */
export function useBulkUpdateLeadsStage(
  orgId: string,
  options?: UseMutationOptions<{ updated: number }, Error, { ids: string[]; stage_id: string }>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, stage_id }: { ids: string[]; stage_id: string }) =>
      fetcherData<{ updated: number }>(`${API}/orgs/${orgId}/leads/bulk`, {
        method: "PATCH",
        body: JSON.stringify({ ids, stage_id }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "leads"] });
    },
    ...options,
  });
}

/** Bulk delete leads. */
export function useBulkDeleteLeads(
  orgId: string,
  options?: UseMutationOptions<{ deleted: number }, Error, string[]>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      fetcherData<{ deleted: number }>(`${API}/orgs/${orgId}/leads/bulk`, {
        method: "DELETE",
        body: JSON.stringify({ ids }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "leads"] });
    },
    ...options,
  });
}

export type LeadsStatsResult = {
  total: number;
  byStage: { stage_id: string; stage_name: string; count: number }[];
  bySource: { source: string; count: number }[];
  overTime: { date: string; count: number }[];
  newThisWeek: number;
};

/** Leads stats for insights page. */
export function useLeadsStats(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<LeadsStatsResult>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.leadStats(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<LeadsStatsResult>(`${API}/orgs/${orgId}/leads/stats`)
        : Promise.resolve({
            total: 0,
            byStage: [],
            bySource: [],
            overTime: [],
            newThisWeek: 0,
          }),
    enabled: !!orgId,
    ...options,
  });
}
