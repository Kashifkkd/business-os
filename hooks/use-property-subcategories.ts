"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { PropertySubCategory } from "@/lib/supabase/types";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export interface PropertySubCategoryWithCategory extends PropertySubCategory {
  category_name?: string | null;
}

/** List property sub-categories; optional categoryId filter. */
export function usePropertySubcategoriesList(
  orgId: string | undefined,
  options?: {
    categoryId?: string;
  } & Omit<
    UseQueryOptions<PropertySubCategoryWithCategory[]>,
    "queryKey" | "queryFn"
  >
) {
  const { categoryId, ...rest } = options ?? {};
  return useQuery({
    queryKey: queryKeys.propertySubcategoriesList(orgId ?? "", categoryId),
    queryFn: () => {
      if (!orgId) return Promise.resolve([]);
      const sp = categoryId
        ? `?category_id=${encodeURIComponent(categoryId)}`
        : "";
      return fetcherData<PropertySubCategoryWithCategory[]>(
        `${API}/orgs/${orgId}/property-subcategories${sp}`
      );
    },
    enabled: !!orgId,
    ...rest,
  });
}

export function useCreatePropertySubcategory(
  orgId: string,
  options?: UseMutationOptions<
    PropertySubCategory,
    Error,
    { category_id: string; name: string; sort_order?: number }
  >
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      fetcherData<PropertySubCategory>(
        `${API}/orgs/${orgId}/property-subcategories`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "property-subcategories"] });
    },
    ...options,
  });
}

export function useUpdatePropertySubcategory(
  orgId: string,
  options?: UseMutationOptions<
    PropertySubCategory,
    Error,
    {
      id: string;
      name?: string;
      sort_order?: number;
      category_id?: string;
    }
  >
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) =>
      fetcherData<PropertySubCategory>(
        `${API}/orgs/${orgId}/property-subcategories/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "property-subcategories"] });
    },
    ...options,
  });
}

export function useDeletePropertySubcategory(
  orgId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      fetcherData<void>(
        `${API}/orgs/${orgId}/property-subcategories/${id}`,
        { method: "DELETE" }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "property-subcategories"] });
    },
    ...options,
  });
}
