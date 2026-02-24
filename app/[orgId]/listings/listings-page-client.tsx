"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { useListings, useDeleteListing } from "@/hooks/use-listings";
import { ListingsTable } from "./listings-table";
import { Button } from "@/components/ui/button";
import type { Listing } from "@/lib/supabase/types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];

export function ListingsPageClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const orgId = params?.orgId as string;
 

  const statusFromUrl = searchParams.get("status") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || DEFAULT_PAGE);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE));
  const status = searchParams.get("status") ?? "";

  const { data, isLoading, isRefetching } = useListings(
    orgId,
    { page, pageSize, status: status.trim() || undefined },
    { enabled: !!orgId }
  );

  const deleteListing = useDeleteListing(orgId);

  const handleDelete = (listing: Listing) => {
    if (!confirm(`Delete listing "${listing.title ?? listing.id}"? This cannot be undone.`)) return;
    deleteListing.mutate(listing.id);
  };

  const setStatusFilter = (newStatus: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (newStatus) next.set("status", newStatus);
    else next.delete("status");
    next.delete("page");
    const q = next.toString();
    router.push(`${pathname}${q ? `?${q}` : ""}`);
  };

  const tableData = data ?? {
    items: [],
    total: 0,
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
  };

  const searchParamsForTable = {
    page: String(tableData.page),
    pageSize: String(tableData.pageSize),
    ...(status && { status }),
  };

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-md font-semibold">Listings</h1>
          <p className="text-muted-foreground text-xs">
            Create and publish listings linked to properties.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs">Status:</span>
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value || "all"}
              variant={statusFromUrl === opt.value ? "secondary" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <ListingsTable
        orgId={orgId}
        data={tableData}
        searchParams={searchParamsForTable}
        isLoading={isLoading}
        isRefetching={isRefetching}
        onDelete={handleDelete}
      />
    </div>
  );
}
