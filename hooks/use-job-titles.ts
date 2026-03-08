"use client";

import { useQuery, useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/use-api";
import { fetcherData } from "@/hooks/use-api";
import type { JobTitle } from "@/lib/supabase/types";

const API = "/api";

export function useJobTitles(
  orgId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.jobTitles(orgId ?? ""),
    queryFn: () =>
      orgId ? fetcherData<JobTitle[]>(`${API}/orgs/${orgId}/job-titles`) : Promise.resolve([]),
    enabled: !!orgId && (options?.enabled !== false),
  });
}

export function useCreateJobTitle(
  orgId: string,
  options?: UseMutationOptions<JobTitle, Error, { name: string }>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      fetcherData<JobTitle>(`${API}/orgs/${orgId}/job-titles`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.jobTitles(orgId) });
    },
    ...options,
  });
}

export function useUpdateJobTitle(
  orgId: string,
  options?: UseMutationOptions<JobTitle, Error, { id: string; name: string }>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      fetcherData<JobTitle>(`${API}/orgs/${orgId}/job-titles/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.jobTitles(orgId) });
    },
    ...options,
  });
}

export function useDeleteJobTitle(
  orgId: string,
  options?: UseMutationOptions<{ deleted: boolean }, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcherData<{ deleted: boolean }>(`${API}/orgs/${orgId}/job-titles/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.jobTitles(orgId) });
    },
    ...options,
  });
}
