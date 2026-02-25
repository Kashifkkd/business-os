"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Property } from "@/lib/supabase/types";
import type { GetPropertiesResult } from "@/lib/supabase/queries";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export type CreatePropertyPayload = {
  address: string;
  type?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state_or_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  property_type?: string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  half_baths?: number | null;
  living_area_sqft?: number | null;
  lot_size_sqft?: number | null;
  year_built?: number | null;
  parcel_number?: string | null;
  reference_id?: string | null;
  features?: Record<string, unknown> | null;
  notes?: string | null;
};

export type UpdatePropertyPayload = {
  address?: string;
  type?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state_or_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  property_type?: string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  half_baths?: number | null;
  living_area_sqft?: number | null;
  lot_size_sqft?: number | null;
  year_built?: number | null;
  parcel_number?: string | null;
  reference_id?: string | null;
  features?: Record<string, unknown> | null;
  notes?: string | null;
};

/** Paginated properties list. */
export function useProperties(
  orgId: string | undefined,
  params: { page: number; pageSize: number; search?: string },
  options?: Omit<UseQueryOptions<GetPropertiesResult>, "queryKey" | "queryFn">
) {
  const { page, pageSize, search } = params;
  return useQuery({
    queryKey: queryKeys.properties(orgId ?? "", { page, pageSize, search }),
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 10 });
      const sp = new URLSearchParams();
      if (page > 1) sp.set("page", String(page));
      if (pageSize !== 10) sp.set("pageSize", String(pageSize));
      if (search) sp.set("search", search);
      const q = sp.toString();
      return fetcherData<GetPropertiesResult>(
        `${API}/orgs/${orgId}/properties${q ? `?${q}` : ""}`
      );
    },
    enabled: !!orgId,
    ...options,
  });
}

/** Single property (for edit). */
export function useProperty(
  orgId: string | undefined,
  propertyId: string | undefined,
  options?: Omit<UseQueryOptions<Property | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.property(orgId ?? "", propertyId ?? ""),
    queryFn: () =>
      orgId && propertyId
        ? fetcherData<Property>(`${API}/orgs/${orgId}/properties/${propertyId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!propertyId,
    ...options,
  });
}

/** Create a property. Invalidates properties list. */
export function useCreateProperty(
  orgId: string,
  options?: UseMutationOptions<Property, Error, CreatePropertyPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePropertyPayload) =>
      fetcherData<Property>(`${API}/orgs/${orgId}/properties`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "properties"] });
    },
    ...options,
  });
}

/** Update a property. Invalidates property and list. */
export function useUpdateProperty(
  orgId: string,
  propertyId: string,
  options?: UseMutationOptions<Property, Error, UpdatePropertyPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePropertyPayload) =>
      fetcherData<Property>(`${API}/orgs/${orgId}/properties/${propertyId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.property(orgId, propertyId), data);
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "properties"] });
    },
    ...options,
  });
}

/** Delete a property. Invalidates properties list. */
export function useDeleteProperty(
  orgId: string,
  options?: UseMutationOptions<{ deleted: true }, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: string) =>
      fetcherData<{ deleted: true }>(`${API}/orgs/${orgId}/properties/${propertyId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "properties"] });
    },
    ...options,
  });
}
