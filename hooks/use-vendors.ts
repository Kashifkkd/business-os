"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Vendor } from "@/lib/supabase/types";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export type CreateVendorPayload = {
  name: string;
  email?: string | null;
  phone?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state_or_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  payment_terms?: string | null;
  notes?: string | null;
};

export type UpdateVendorPayload = CreateVendorPayload;

export function useVendors(
  orgId: string | undefined,
  options?: Omit<UseQueryOptions<Vendor[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.vendors(orgId ?? ""),
    queryFn: () =>
      orgId
        ? fetcherData<Vendor[]>(`${API}/orgs/${orgId}/inventory/vendors`)
        : Promise.resolve([]),
    enabled: !!orgId,
    ...options,
  });
}

export function useVendor(
  orgId: string | undefined,
  vendorId: string | undefined,
  options?: Omit<UseQueryOptions<Vendor | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.vendor(orgId ?? "", vendorId ?? ""),
    queryFn: () =>
      orgId && vendorId
        ? fetcherData<Vendor>(`${API}/orgs/${orgId}/inventory/vendors/${vendorId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!vendorId,
    ...options,
  });
}

export function useCreateVendor(
  orgId: string,
  options?: UseMutationOptions<Vendor, Error, CreateVendorPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVendorPayload) =>
      fetcherData<Vendor>(`${API}/orgs/${orgId}/inventory/vendors`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.vendors(orgId) });
    },
    ...options,
  });
}

export function useUpdateVendor(
  orgId: string,
  vendorId: string,
  options?: UseMutationOptions<Vendor, Error, UpdateVendorPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateVendorPayload) =>
      fetcherData<Vendor>(`${API}/orgs/${orgId}/inventory/vendors/${vendorId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.vendor(orgId, vendorId), data);
      qc.invalidateQueries({ queryKey: queryKeys.vendors(orgId) });
    },
    ...options,
  });
}

export function useDeleteVendor(
  orgId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vendorId: string) =>
      fetcherData<void>(`${API}/orgs/${orgId}/inventory/vendors/${vendorId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.vendors(orgId) });
    },
    ...options,
  });
}
