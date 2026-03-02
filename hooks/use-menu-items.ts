"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { MenuItem } from "@/lib/supabase/types";
import type { GetMenuItemsPaginatedResult } from "@/lib/supabase/queries";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export type CreateMenuItemPayload = {
  name: string;
  description?: string | null;
  long_description?: string | null;
  price: number;
  discounted_price?: number | null;
  sub_category_id?: string | null;
  food_type?: "veg" | "non_veg";
  images?: string[];
  sort_order?: number;
  is_active?: boolean;
  sku?: string | null;
  stock_quantity?: number | null;
  minimum_stock?: number | null;
  minimum_order?: number | null;
  inventory_item_id?: string | null;
  dietary_tags?: string[];
  allergens?: string[];
  prep_time_minutes?: number | null;
  unit?: string | null;
};

export type UpdateMenuItemPayload = CreateMenuItemPayload;

/** Paginated menu items list. */
export function useMenuItemsPaginated(
  orgId: string | undefined,
  params: { page: number; pageSize: number; search?: string },
  options?: Omit<UseQueryOptions<GetMenuItemsPaginatedResult>, "queryKey" | "queryFn">
) {
  const { page, pageSize, search } = params;
  return useQuery({
    queryKey: queryKeys.menuItems(orgId ?? "", { page, pageSize, search }),
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 10 });
      const sp = new URLSearchParams();
      if (page > 1) sp.set("page", String(page));
      if (pageSize !== 10) sp.set("pageSize", String(pageSize));
      if (search) sp.set("search", search);
      const q = sp.toString();
      return fetcherData<GetMenuItemsPaginatedResult>(
        `${API}/orgs/${orgId}/menu-items${q ? `?${q}` : ""}`
      );
    },
    enabled: !!orgId,
    ...options,
  });
}

/** Single menu item (for edit). */
export function useMenuItem(
  orgId: string | undefined,
  itemId: string | undefined,
  options?: Omit<UseQueryOptions<MenuItem | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.menuItem(orgId ?? "", itemId ?? ""),
    queryFn: () =>
      orgId && itemId
        ? fetcherData<MenuItem>(`${API}/orgs/${orgId}/menu-items/${itemId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!itemId,
    ...options,
  });
}

/** Create a menu item. Invalidates menu items list and categories. */
export function useCreateMenuItem(
  orgId: string,
  options?: UseMutationOptions<MenuItem, Error, CreateMenuItemPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMenuItemPayload) =>
      fetcherData<MenuItem>(`${API}/orgs/${orgId}/menu-items`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "menu-items"] });
      qc.invalidateQueries({ queryKey: queryKeys.menuCategories(orgId) });
    },
    ...options,
  });
}

/** Update a menu item. Invalidates menu item and list. */
export function useUpdateMenuItem(
  orgId: string,
  itemId: string,
  options?: UseMutationOptions<MenuItem, Error, UpdateMenuItemPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMenuItemPayload) =>
      fetcherData<MenuItem>(`${API}/orgs/${orgId}/menu-items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.menuItem(orgId, itemId), data);
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "menu-items"] });
      qc.invalidateQueries({ queryKey: queryKeys.menuCategories(orgId) });
    },
    ...options,
  });
}
