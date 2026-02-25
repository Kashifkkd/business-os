"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Department } from "@/lib/supabase/types";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export function useDepartmentsList(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<Department[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.departmentsList(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<Department[]>(`${API}/orgs/${orgId}/departments`)
        : Promise.resolve([]),
    enabled: !!orgId,
    ...options,
  });
}

export function useCreateDepartment(
  orgId: string,
  options?: UseMutationOptions<
    Department,
    Error,
    { name: string; code?: string | null; parent_id?: string | null; sort_order?: number }
  >
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      fetcherData<Department>(`${API}/orgs/${orgId}/departments`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.departmentsList(orgId) });
    },
    ...options,
  });
}

export function useUpdateDepartment(
  orgId: string,
  options?: UseMutationOptions<
    Department,
    Error,
    { id: string; name?: string; code?: string | null; parent_id?: string | null; sort_order?: number }
  >
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) =>
      fetcherData<Department>(`${API}/orgs/${orgId}/departments/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.departmentsList(orgId) });
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "employees"] });
    },
    ...options,
  });
}

export function useDeleteDepartment(
  orgId: string,
  options?: UseMutationOptions<{ deleted: true }, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcherData<{ deleted: true }>(`${API}/orgs/${orgId}/departments/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.departmentsList(orgId) });
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "employees"] });
    },
    ...options,
  });
}
