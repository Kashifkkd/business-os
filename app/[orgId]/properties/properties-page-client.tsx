"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { useProperties, useDeleteProperty } from "@/hooks/use-properties";
import { useDebounce } from "@/hooks/use-debounce";
import { PropertiesTable } from "./properties-table";
import { DateRangeFilter, getDefaultDateRange, type DateRangeValue } from "@/components/date-range-filter";
import { Button } from "@/components/ui/button";
import type { Property } from "@/lib/supabase/types";
import { Upload } from "lucide-react";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

export function PropertiesPageClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const orgId = params?.orgId as string;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [dateRange, setDateRange] = useState<DateRangeValue>(getDefaultDateRange());
  const searchFromUrl = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  const setParams = useCallback(
    (updates: { page?: number; search?: string }) => {
      const next = new URLSearchParams(searchParams.toString());
      const p = updates.page ?? 1;
      const s = updates.search ?? searchFromUrl;
      if (p > 1) next.set("page", String(p));
      else next.delete("page");
      if (s) next.set("search", s);
      else next.delete("search");
      const q = next.toString();
      router.push(`${pathname}${q ? `?${q}` : ""}`);
    },
    [pathname, router, searchFromUrl, searchParams]
  );

  const setParamsRef = useRef(setParams);
  useEffect(() => {
    setParamsRef.current = setParams;
  }, [setParams]);

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed === searchFromUrl.trim()) return;
    setParamsRef.current({ search: trimmed, page: 1 });
  }, [debouncedSearch, searchFromUrl]);

  const page = Math.max(1, Number(searchParams.get("page")) || DEFAULT_PAGE);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE));
  const search = searchParams.get("search") ?? "";

  const { data, isLoading, isRefetching } = useProperties(
    orgId,
    { page, pageSize, search: search.trim() || undefined },
    { enabled: !!orgId && mounted }
  );

  const deleteProperty = useDeleteProperty(orgId);

  const handleDelete = useCallback(
    (property: Property) => {
      if (!confirm(`Delete property "${property.address}"? This cannot be undone.`)) return;
      deleteProperty.mutate(property.id);
    },
    [deleteProperty]
  );

  const tableData = data ?? {
    items: [],
    total: 0,
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
  };

  const searchParamsForTable = {
    page: String(tableData.page),
    pageSize: String(tableData.pageSize),
    ...(search && { search }),
  };

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-md font-semibold">Properties</h1>
          <p className="text-muted-foreground text-xs">
            Manage property addresses and types.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
            placeholder="Date range"
            className="min-w-[140px]"
          />
          <Button variant="outline" size="sm">
            <Upload className="size-3.5" />
            Import
          </Button>
        </div>
      </div>

      <PropertiesTable
        orgId={orgId}
        data={tableData}
        searchParams={searchParamsForTable}
        isLoading={isLoading}
        isRefetching={isRefetching}
        onDelete={handleDelete}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
      />
    </div>
  );
}
