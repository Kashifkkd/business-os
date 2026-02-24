"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { MenuCategory } from "@/lib/supabase/types";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export interface MenuCategoryForDropdown {
  id: string;
  name: string;
  sort_order: number;
}

export interface MenuSubCategoryForDropdown {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  sort_order: number;
}

export interface MenuCategoriesData {
  categories: MenuCategoryForDropdown[];
  subCategories: MenuSubCategoryForDropdown[];
}

/** Distinct categories and sub-categories for dropdowns. */
export function useMenuCategories(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<MenuCategoriesData>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.menuCategories(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<MenuCategoriesData>(`${API}/orgs/${orgId}/menu-items/categories`)
        : Promise.resolve({ categories: [], subCategories: [] }),
    enabled: !!orgId,
    ...options,
  });
}

/** List menu categories for tenant. */
export function useMenuCategoriesList(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<MenuCategory[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.menuCategoriesList(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<MenuCategory[]>(`${API}/orgs/${orgId}/menu-categories`)
        : Promise.resolve([]),
    enabled: !!orgId,
    ...options,
  });
}

/** Alias: fetch all menu categories (for combobox / menu form). */
export function useMenuCategory(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<MenuCategory[]>, "queryKey" | "queryFn">
) {
  return useMenuCategoriesList(orgId, options);
}

export function useCreateMenuCategory(
  orgId: string,
  options?: UseMutationOptions<MenuCategory, Error, { name: string; sort_order?: number }>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      fetcherData<MenuCategory>(`${API}/orgs/${orgId}/menu-categories`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menuCategoriesList(orgId) });
      qc.invalidateQueries({ queryKey: queryKeys.menuCategories(orgId) });
    },
    ...options,
  });
}

export function useUpdateMenuCategory(
  orgId: string,
  options?: UseMutationOptions<MenuCategory, Error, { id: string; name?: string; sort_order?: number }>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) =>
      fetcherData<MenuCategory>(`${API}/orgs/${orgId}/menu-categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menuCategoriesList(orgId) });
      qc.invalidateQueries({ queryKey: queryKeys.menuCategories(orgId) });
    },
    ...options,
  });
}

export function useDeleteMenuCategory(
  orgId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      fetcherData<void>(`${API}/orgs/${orgId}/menu-categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menuCategoriesList(orgId) });
      qc.invalidateQueries({ queryKey: queryKeys.menuCategories(orgId) });
    },
    ...options,
  });
}
