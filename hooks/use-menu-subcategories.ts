"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { MenuSubCategory } from "@/lib/supabase/types";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export interface MenuSubCategoryWithCategory extends MenuSubCategory {
  category_name?: string | null;
}

/** List menu sub-categories; optional categoryId filter. */
export function useMenuSubcategoriesList(
  orgId: string | undefined,
  options?: { categoryId?: string } & Omit<UseQueryOptions<MenuSubCategoryWithCategory[]>, "queryKey" | "queryFn">
) {
  const { categoryId, ...rest } = options ?? {};
  return useQuery({
    queryKey: queryKeys.menuSubcategoriesList(orgId ?? "", categoryId),
    queryFn: () => {
      if (!orgId) return Promise.resolve([]);
      const sp = categoryId ? `?category_id=${encodeURIComponent(categoryId)}` : "";
      return fetcherData<MenuSubCategoryWithCategory[]>(`${API}/orgs/${orgId}/menu-subcategories${sp}`);
    },
    enabled: !!orgId,
    ...rest,
  });
}

/** Alias: fetch subcategories, optionally filtered by categoryId. */
export function useMenuSubCategory(
  orgId: string | undefined,
  categoryId: string | undefined,
  options?: Omit<UseQueryOptions<MenuSubCategoryWithCategory[]>, "queryKey" | "queryFn">
) {
  return useMenuSubcategoriesList(orgId, { ...options, categoryId: categoryId ?? undefined });
}

export function useCreateMenuSubcategory(
  orgId: string,
  options?: UseMutationOptions<MenuSubCategory, Error, { category_id: string; name: string; sort_order?: number }>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      fetcherData<MenuSubCategory>(`${API}/orgs/${orgId}/menu-subcategories`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "menu-subcategories"] });
      qc.invalidateQueries({ queryKey: queryKeys.menuCategories(orgId) });
    },
    ...options,
  });
}

export function useUpdateMenuSubcategory(
  orgId: string,
  options?: UseMutationOptions<MenuSubCategory, Error, { id: string; name?: string; sort_order?: number; category_id?: string }>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) =>
      fetcherData<MenuSubCategory>(`${API}/orgs/${orgId}/menu-subcategories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "menu-subcategories"] });
      qc.invalidateQueries({ queryKey: queryKeys.menuCategories(orgId) });
    },
    ...options,
  });
}

export function useDeleteMenuSubcategory(
  orgId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      fetcherData<void>(`${API}/orgs/${orgId}/menu-subcategories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "menu-subcategories"] });
      qc.invalidateQueries({ queryKey: queryKeys.menuCategories(orgId) });
    },
    ...options,
  });
}
