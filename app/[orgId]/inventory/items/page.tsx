"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { useInventoryItemsPaginated } from "@/hooks/use-inventory-items";
import { useDebounce } from "@/hooks/use-debounce";
import { InventoryItemsTable } from "./inventory-items-table";
import { SearchBox } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

export default function InventoryItemsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const orgId = params?.orgId as string;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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

  const { data, isLoading, isRefetching } = useInventoryItemsPaginated(
    orgId,
    { page, pageSize, search: search.trim() || undefined },
    { enabled: !!orgId && mounted }
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
          <h1 className="text-md font-semibold">Inventory Items</h1>
          <p className="text-muted-foreground text-xs">
            Manage products, SKUs, pricing, and stock levels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SearchBox
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search items..."
            className="w-56 sm:w-64"
          />
          <Button size="sm" asChild>
            <a href={`/${orgId}/inventory/items/new`}>
              <Plus className="size-3.5" />
              Create
            </a>
          </Button>
        </div>
      </div>

      <InventoryItemsTable
        orgId={orgId}
        data={tableData}
        searchParams={searchParamsForTable}
        isLoading={isLoading}
        isRefetching={isRefetching}
      />
    </div>
  );
}
