"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { PropertyCategory } from "@/lib/supabase/types";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

/** List property categories for tenant. */
export function usePropertyCategoriesList(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<PropertyCategory[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.propertyCategoriesList(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<PropertyCategory[]>(
            `${API}/orgs/${orgId}/property-categories`
          )
        : Promise.resolve([]),
    enabled: !!orgId,
    ...options,
  });
}

export function useCreatePropertyCategory(
  orgId: string,
  options?: UseMutationOptions<
    PropertyCategory,
    Error,
    { name: string; sort_order?: number }
  >
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      fetcherData<PropertyCategory>(
        `${API}/orgs/${orgId}/property-categories`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.propertyCategoriesList(orgId),
      });
    },
    ...options,
  });
}

export function useUpdatePropertyCategory(
  orgId: string,
  options?: UseMutationOptions<
    PropertyCategory,
    Error,
    { id: string; name?: string; sort_order?: number }
  >
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) =>
      fetcherData<PropertyCategory>(
        `${API}/orgs/${orgId}/property-categories/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.propertyCategoriesList(orgId),
      });
    },
    ...options,
  });
}

export function useDeletePropertyCategory(
  orgId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      fetcherData<void>(
        `${API}/orgs/${orgId}/property-categories/${id}`,
        { method: "DELETE" }
      ),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.propertyCategoriesList(orgId),
      });
    },
    ...options,
  });
}
