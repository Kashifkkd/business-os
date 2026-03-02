"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type {
  TaskSpace,
  TaskList,
  TaskStatus,
  TaskLabel,
  Task,
  TaskComment,
  TaskActivity,
} from "@/lib/supabase/types";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export interface GetTasksResult {
  items: Task[];
  total: number;
  page: number;
  pageSize: number;
}

export type TasksQueryParams = {
  space_id: string;
  list_id?: string;
  status_id?: string;
  assignee_id?: string;
  parent_id?: string;
  search?: string;
  sortBy?: string;
  order?: string;
  page: number;
  pageSize: number;
  /** Comma-separated: assignees, labels */
  enrich?: string;
  due_after?: string;
  due_before?: string;
};

/** List of spaces for org. */
export function useSpaces(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<TaskSpace[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.spaces(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<TaskSpace[]>(`${API}/orgs/${orgId}/spaces`)
        : Promise.resolve([]),
    enabled: !!orgId,
    ...options,
  });
}

/** Single space. */
export function useSpace(
  orgId: string | undefined,
  spaceId: string | undefined,
  options?: Omit<UseQueryOptions<TaskSpace | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.space(orgId ?? "", spaceId ?? ""),
    queryFn: () =>
      orgId && spaceId
        ? fetcherData<TaskSpace>(`${API}/orgs/${orgId}/spaces/${spaceId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!spaceId,
    ...options,
  });
}

/** Lists for a space. */
export function useSpaceLists(
  orgId: string | undefined,
  spaceId: string | undefined,
  options?: Omit<UseQueryOptions<TaskList[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.spaceLists(orgId ?? "", spaceId ?? ""),
    queryFn: () =>
      orgId && spaceId
        ? fetcherData<TaskList[]>(`${API}/orgs/${orgId}/spaces/${spaceId}/lists`)
        : Promise.resolve([]),
    enabled: !!orgId && !!spaceId,
    ...options,
  });
}

/** Statuses for a space (or org defaults). */
export function useSpaceStatuses(
  orgId: string | undefined,
  spaceId: string | undefined,
  options?: Omit<UseQueryOptions<TaskStatus[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.spaceStatuses(orgId ?? "", spaceId ?? ""),
    queryFn: () =>
      orgId && spaceId
        ? fetcherData<TaskStatus[]>(`${API}/orgs/${orgId}/spaces/${spaceId}/statuses`)
        : Promise.resolve([]),
    enabled: !!orgId && !!spaceId,
    ...options,
  });
}

/** Labels for a space (and org-scoped). */
export function useSpaceLabels(
  orgId: string | undefined,
  spaceId: string | undefined,
  options?: Omit<UseQueryOptions<TaskLabel[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.spaceLabels(orgId ?? "", spaceId ?? ""),
    queryFn: () =>
      orgId && spaceId
        ? fetcherData<TaskLabel[]>(`${API}/orgs/${orgId}/spaces/${spaceId}/labels`)
        : Promise.resolve([]),
    enabled: !!orgId && !!spaceId,
    ...options,
  });
}

/** Paginated tasks list. */
export function useTasks(
  orgId: string | undefined,
  params: TasksQueryParams,
  options?: Omit<UseQueryOptions<GetTasksResult>, "queryKey" | "queryFn">
) {
  const { space_id, page = 1, pageSize = 20, sortBy = "sort_order", order = "desc" } = params;
  return useQuery({
    queryKey: queryKeys.tasks(orgId ?? "", { ...params, page, pageSize, sortBy, order }),
    queryFn: () => {
      if (!orgId || !space_id) {
        return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 20 });
      }
      const sp = new URLSearchParams();
      sp.set("space_id", space_id);
      sp.set("page", String(params.page));
      sp.set("pageSize", String(params.pageSize));
      if (params.list_id) sp.set("list_id", params.list_id);
      if (params.status_id) sp.set("status_id", params.status_id);
      if (params.assignee_id) sp.set("assignee_id", params.assignee_id);
      if (params.parent_id !== undefined) sp.set("parent_id", params.parent_id ?? "null");
      if (params.search) sp.set("search", params.search);
      if (params.sortBy) sp.set("sortBy", params.sortBy);
      if (params.order) sp.set("order", params.order);
      if (params.enrich) sp.set("enrich", params.enrich);
      if (params.due_after) sp.set("due_after", params.due_after);
      if (params.due_before) sp.set("due_before", params.due_before);
      return fetcherData<GetTasksResult>(`${API}/orgs/${orgId}/tasks?${sp.toString()}`);
    },
    enabled: !!orgId && !!space_id,
    ...options,
  });
}

/** Single task. */
export function useTask(
  orgId: string | undefined,
  taskId: string | undefined,
  options?: Omit<UseQueryOptions<Task | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.task(orgId ?? "", taskId ?? ""),
    queryFn: () =>
      orgId && taskId
        ? fetcherData<Task>(`${API}/orgs/${orgId}/tasks/${taskId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!taskId,
    ...options,
  });
}

/** Task comments. */
export function useTaskComments(
  orgId: string | undefined,
  taskId: string | undefined,
  options?: Omit<UseQueryOptions<TaskComment[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.taskComments(orgId ?? "", taskId ?? ""),
    queryFn: () =>
      orgId && taskId
        ? fetcherData<TaskComment[]>(`${API}/orgs/${orgId}/tasks/${taskId}/comments`)
        : Promise.resolve([]),
    enabled: !!orgId && !!taskId,
    ...options,
  });
}

/** Task activity timeline. */
export function useTaskActivities(
  orgId: string | undefined,
  taskId: string | undefined,
  options?: Omit<UseQueryOptions<TaskActivity[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.taskActivities(orgId ?? "", taskId ?? ""),
    queryFn: () =>
      orgId && taskId
        ? fetcherData<TaskActivity[]>(`${API}/orgs/${orgId}/tasks/${taskId}/activities`)
        : Promise.resolve([]),
    enabled: !!orgId && !!taskId,
    ...options,
  });
}

// ——— Mutations ———

export type CreateSpacePayload = { name: string; description?: string | null; sort_order?: number };
export type UpdateSpacePayload = Partial<{ name: string; description: string | null; sort_order: number; settings: Record<string, unknown> }>;
export type CreateListPayload = { name: string; sort_order?: number };
export type UpdateListPayload = Partial<{ name: string; sort_order: number }>;
export type CreateTaskPayload = {
  space_id: string;
  list_id: string;
  parent_id?: string | null;
  status_id?: string | null;
  title: string;
  description?: string | null;
  priority?: Task["priority"];
  due_date?: string | null;
  start_date?: string | null;
  sort_order?: number;
  assignee_ids?: string[];
  label_ids?: string[];
};
export type UpdateTaskPayload = Partial<{
  list_id: string;
  parent_id: string | null;
  status_id: string;
  title: string;
  description: string | null;
  priority: Task["priority"];
  due_date: string | null;
  start_date: string | null;
  sort_order: number;
  custom_fields: Record<string, unknown>;
  assignee_ids: string[];
  label_ids: string[];
}>;

export function useCreateSpace(
  orgId: string,
  options?: UseMutationOptions<TaskSpace, Error, CreateSpacePayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSpacePayload) =>
      fetcherData<TaskSpace>(`${API}/orgs/${orgId}/spaces`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.spaces(orgId) });
    },
    ...options,
  });
}

export function useUpdateSpace(
  orgId: string,
  spaceId: string,
  options?: UseMutationOptions<TaskSpace, Error, UpdateSpacePayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSpacePayload) =>
      fetcherData<TaskSpace>(`${API}/orgs/${orgId}/spaces/${spaceId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.space(orgId, spaceId), data);
      qc.invalidateQueries({ queryKey: queryKeys.spaces(orgId) });
    },
    ...options,
  });
}

export function useDeleteSpace(
  orgId: string,
  options?: UseMutationOptions<{ deleted: true }, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (spaceId: string) =>
      fetcherData<{ deleted: true }>(`${API}/orgs/${orgId}/spaces/${spaceId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.spaces(orgId) });
    },
    ...options,
  });
}

export function useCreateList(
  orgId: string,
  spaceId: string,
  options?: UseMutationOptions<TaskList, Error, CreateListPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateListPayload) =>
      fetcherData<TaskList>(`${API}/orgs/${orgId}/spaces/${spaceId}/lists`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.spaceLists(orgId, spaceId) });
    },
    ...options,
  });
}

export function useUpdateList(
  orgId: string,
  spaceId: string,
  listId: string,
  options?: UseMutationOptions<TaskList, Error, UpdateListPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateListPayload) =>
      fetcherData<TaskList>(`${API}/orgs/${orgId}/spaces/${spaceId}/lists/${listId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.spaceLists(orgId, spaceId) });
    },
    ...options,
  });
}

export function useDeleteList(
  orgId: string,
  spaceId: string,
  options?: UseMutationOptions<{ deleted: true }, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) =>
      fetcherData<{ deleted: true }>(`${API}/orgs/${orgId}/spaces/${spaceId}/lists/${listId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.spaceLists(orgId, spaceId) });
    },
    ...options,
  });
}

export function useCreateTask(
  orgId: string,
  options?: UseMutationOptions<Task, Error, CreateTaskPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskPayload) =>
      fetcherData<Task>(`${API}/orgs/${orgId}/tasks`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data) => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "tasks"] });
    },
    ...options,
  });
}

export function useUpdateTask(
  orgId: string,
  taskId: string,
  options?: UseMutationOptions<Task, Error, UpdateTaskPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTaskPayload) =>
      fetcherData<Task>(`${API}/orgs/${orgId}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.task(orgId, taskId), data);
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "tasks"] });
    },
    ...options,
  });
}

/** Update any task by id (e.g. for board drag-and-drop). */
export function useUpdateTaskById(
  orgId: string,
  options?: UseMutationOptions<Task, Error, { taskId: string; data: UpdateTaskPayload }>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskPayload }) =>
      fetcherData<Task>(`${API}/orgs/${orgId}/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.task(orgId, data.id), data);
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "tasks"] });
    },
    ...options,
  });
}

export function useDeleteTask(
  orgId: string,
  options?: UseMutationOptions<{ deleted: true }, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      fetcherData<{ deleted: true }>(`${API}/orgs/${orgId}/tasks/${taskId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "tasks"] });
    },
    ...options,
  });
}

export function useCreateTaskComment(
  orgId: string,
  taskId: string,
  options?: UseMutationOptions<TaskComment, Error, { body: string; parent_id?: string | null }>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { body: string; parent_id?: string | null }) =>
      fetcherData<TaskComment>(`${API}/orgs/${orgId}/tasks/${taskId}/comments`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.taskComments(orgId, taskId) });
      qc.invalidateQueries({ queryKey: queryKeys.taskActivities(orgId, taskId) });
    },
    ...options,
  });
}
