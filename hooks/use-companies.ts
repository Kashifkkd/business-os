"use client";

import { useQuery, useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/use-api";
import { fetcherData } from "@/hooks/use-api";
import type { Company } from "@/lib/supabase/types";

const API = "/api";

export function useCompanies(
  orgId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.companies(orgId ?? ""),
    queryFn: () =>
      orgId ? fetcherData<Company[]>(`${API}/orgs/${orgId}/companies`) : Promise.resolve([]),
    enabled: !!orgId && (options?.enabled !== false),
  });
}

export function useCreateCompany(
  orgId: string,
  options?: UseMutationOptions<Company, Error, { name: string }>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      fetcherData<Company>(`${API}/orgs/${orgId}/companies`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.companies(orgId) });
    },
    ...options,
  });
}
