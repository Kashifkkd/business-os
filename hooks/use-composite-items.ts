"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { CompositeItem, CompositeItemComponent } from "@/lib/supabase/types";
import type { GetCompositeItemsResult } from "@/lib/supabase/queries";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export type CreateCompositeItemPayload = {
  inventory_item_id: string;
  name: string;
  description?: string | null;
  components: { item_id: string; variant_id?: string | null; quantity: number }[];
};

export type UpdateCompositeItemPayload = {
  name?: string;
  description?: string | null;
  components?: { item_id: string; variant_id?: string | null; quantity: number }[];
};

export function useCompositeItemsPaginated(
  orgId: string | undefined,
  params: { page: number; pageSize: number; search?: string },
  options?: Omit<UseQueryOptions<GetCompositeItemsResult>, "queryKey" | "queryFn">
) {
  const { page, pageSize, search } = params;
  return useQuery({
    queryKey: queryKeys.compositeItems(orgId ?? "", { page, pageSize, search }),
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 10 });
      const sp = new URLSearchParams();
      if (page > 1) sp.set("page", String(page));
      if (pageSize !== 10) sp.set("pageSize", String(pageSize));
      if (search) sp.set("search", search);
      const q = sp.toString();
      return fetcherData<GetCompositeItemsResult>(
        `${API}/orgs/${orgId}/inventory/composite-items${q ? `?${q}` : ""}`
      );
    },
    enabled: !!orgId,
    ...options,
  });
}

export function useCompositeItem(
  orgId: string | undefined,
  compositeId: string | undefined,
  options?: Omit<UseQueryOptions<CompositeItem & { components?: (CompositeItemComponent & { item_name?: string | null })[] } | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.compositeItem(orgId ?? "", compositeId ?? ""),
    queryFn: () =>
      orgId && compositeId
        ? fetcherData<CompositeItem & { components?: (CompositeItemComponent & { item_name?: string | null })[] }>(
            `${API}/orgs/${orgId}/inventory/composite-items/${compositeId}`
          ).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!compositeId,
    ...options,
  });
}

export function useCreateCompositeItem(
  orgId: string,
  options?: UseMutationOptions<CompositeItem, Error, CreateCompositeItemPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCompositeItemPayload) =>
      fetcherData<CompositeItem>(`${API}/orgs/${orgId}/inventory/composite-items`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory", "composite-items"] });
    },
    ...options,
  });
}

export function useUpdateCompositeItem(
  orgId: string,
  compositeId: string,
  options?: UseMutationOptions<CompositeItem, Error, UpdateCompositeItemPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCompositeItemPayload) =>
      fetcherData<CompositeItem>(`${API}/orgs/${orgId}/inventory/composite-items/${compositeId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.compositeItem(orgId, compositeId), data);
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory", "composite-items"] });
    },
    ...options,
  });
}

export function useDeleteCompositeItem(
  orgId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (compositeId: string) =>
      fetcherData<void>(`${API}/orgs/${orgId}/inventory/composite-items/${compositeId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "inventory", "composite-items"] });
    },
    ...options,
  });
}
