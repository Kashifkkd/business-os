"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Designation } from "@/lib/supabase/types";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export function useDesignationsList(
  orgId: string | undefined,
  params?: { department_id?: string },
  options?: Omit<UseQueryOptions<Designation[]>, "queryKey" | "queryFn">
) {
  const departmentId = params?.department_id;
  return useQuery({
    queryKey: queryKeys.designationsList(orgId ?? "", departmentId),
    queryFn: () => {
      if (!orgId) return Promise.resolve([]);
      const q = departmentId ? `?department_id=${encodeURIComponent(departmentId)}` : "";
      return fetcherData<Designation[]>(`${API}/orgs/${orgId}/designations${q}`);
    },
    enabled: !!orgId,
    ...options,
  });
}

export function useCreateDesignation(
  orgId: string,
  options?: UseMutationOptions<
    Designation,
    Error,
    { name: string; department_id?: string | null; sort_order?: number; level?: number | null }
  >
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      fetcherData<Designation>(`${API}/orgs/${orgId}/designations`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "designations"] });
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "employees"] });
    },
    ...options,
  });
}

export function useUpdateDesignation(
  orgId: string,
  options?: UseMutationOptions<
    Designation,
    Error,
    { id: string; name?: string; department_id?: string | null; sort_order?: number; level?: number | null }
  >
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) =>
      fetcherData<Designation>(`${API}/orgs/${orgId}/designations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "designations"] });
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "employees"] });
    },
    ...options,
  });
}

export function useDeleteDesignation(
  orgId: string,
  options?: UseMutationOptions<{ deleted: true }, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcherData<{ deleted: true }>(`${API}/orgs/${orgId}/designations/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "designations"] });
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "employees"] });
    },
    ...options,
  });
}
