"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { MenuDiscount } from "@/lib/supabase/types";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export type CreateDiscountPayload = {
  name: string;
  type: "percentage" | "fixed";
  value: number;
  is_active?: boolean;
  description?: string | null;
};

export type UpdateDiscountPayload = Partial<CreateDiscountPayload>;

/** List menu discounts for tenant. */
export function useMenuDiscounts(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<MenuDiscount[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.menuDiscounts(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<MenuDiscount[]>(`${API}/orgs/${orgId}/menu-discounts`)
        : Promise.resolve([]),
    enabled: !!orgId,
    ...options,
  });
}

export function useCreateDiscount(
  orgId: string,
  options?: UseMutationOptions<MenuDiscount, Error, CreateDiscountPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      fetcherData<MenuDiscount>(`${API}/orgs/${orgId}/menu-discounts`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menuDiscounts(orgId) });
    },
    ...options,
  });
}

export function useUpdateDiscount(
  orgId: string,
  options?: UseMutationOptions<MenuDiscount, Error, { id: string } & UpdateDiscountPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) =>
      fetcherData<MenuDiscount>(`${API}/orgs/${orgId}/menu-discounts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menuDiscounts(orgId) });
    },
    ...options,
  });
}

export function useDeleteDiscount(
  orgId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      fetcherData<void>(`${API}/orgs/${orgId}/menu-discounts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menuDiscounts(orgId) });
    },
    ...options,
  });
}
