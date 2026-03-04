"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMarketingSegments } from "@/hooks/use-marketing";
import { useDebounce } from "@/hooks/use-debounce";
import { SegmentsTable } from "./segments-table";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

export default function MarketingSegmentsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const orgId = params?.orgId as string;

  const searchFromUrl = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);


  const setParams = useCallback(
    (updates: { page?: number; search?: string }) => {
      const next = new URLSearchParams(searchParams.toString());
      const p = updates.page ?? Math.max(1, Number(searchParams.get("page")) || 1);
      const s = updates.search ?? searchParams.get("search") ?? "";
      if (p > 1) next.set("page", String(p));
      else next.delete("page");
      if (s) next.set("search", s);
      else next.delete("search");
      router.push(`${pathname}${next.toString() ? `?${next}` : ""}`);
    },
    [pathname, router, searchParams]
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

  const { data, isLoading, isRefetching } = useMarketingSegments(
    orgId,
    { page, pageSize, search: search.trim() || undefined },
    { enabled: !!orgId }
  );

  const tableData = data ?? {
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
  };

  const searchParamsForTable: Record<string, string> = {
    page: String(page),
    pageSize: String(pageSize),
  };
  if (search) searchParamsForTable.search = search;

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Segments</h1>
        <p className="text-muted-foreground text-sm">
          Define audiences by lead status, source, and filters.
        </p>
      </div>

      <SegmentsTable
        orgId={orgId}
        data={tableData}
        params={searchParamsForTable}
        isLoading={isLoading || isRefetching}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
      />
    </div>
  );
}
