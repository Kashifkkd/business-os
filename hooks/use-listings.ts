"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Listing } from "@/lib/supabase/types";
import type { GetListingsResult } from "@/lib/supabase/queries";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export type CreateListingPayload = {
  property_id?: string | null;
  status?: string;
  title?: string | null;
  price?: number | null;
  description?: string | null;
};

export type UpdateListingPayload = {
  property_id?: string | null;
  status?: string;
  title?: string | null;
  price?: number | null;
  description?: string | null;
};

/** Paginated listings list. */
export function useListings(
  orgId: string | undefined,
  params: { page: number; pageSize: number; status?: string },
  options?: Omit<UseQueryOptions<GetListingsResult>, "queryKey" | "queryFn">
) {
  const { page, pageSize, status } = params;
  return useQuery({
    queryKey: queryKeys.listings(orgId ?? "", { page, pageSize, status }),
    queryFn: () => {
      if (!orgId) return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 10 });
      const sp = new URLSearchParams();
      if (page > 1) sp.set("page", String(page));
      if (pageSize !== 10) sp.set("pageSize", String(pageSize));
      if (status) sp.set("status", status);
      const q = sp.toString();
      return fetcherData<GetListingsResult>(
        `${API}/orgs/${orgId}/listings${q ? `?${q}` : ""}`
      );
    },
    enabled: !!orgId,
    ...options,
  });
}

/** Single listing (for edit). */
export function useListing(
  orgId: string | undefined,
  listingId: string | undefined,
  options?: Omit<UseQueryOptions<Listing | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.listing(orgId ?? "", listingId ?? ""),
    queryFn: () =>
      orgId && listingId
        ? fetcherData<Listing>(`${API}/orgs/${orgId}/listings/${listingId}`).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!listingId,
    ...options,
  });
}

/** Create a listing. Invalidates listings list. */
export function useCreateListing(
  orgId: string,
  options?: UseMutationOptions<Listing, Error, CreateListingPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateListingPayload) =>
      fetcherData<Listing>(`${API}/orgs/${orgId}/listings`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "listings"] });
    },
    ...options,
  });
}

/** Update a listing. Invalidates listing and list. */
export function useUpdateListing(
  orgId: string,
  listingId: string,
  options?: UseMutationOptions<Listing, Error, UpdateListingPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateListingPayload) =>
      fetcherData<Listing>(`${API}/orgs/${orgId}/listings/${listingId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.listing(orgId, listingId), data);
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "listings"] });
    },
    ...options,
  });
}

/** Delete a listing. Invalidates listings list. */
export function useDeleteListing(
  orgId: string,
  options?: UseMutationOptions<{ deleted: true }, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listingId: string) =>
      fetcherData<{ deleted: true }>(`${API}/orgs/${orgId}/listings/${listingId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "listings"] });
    },
    ...options,
  });
}
