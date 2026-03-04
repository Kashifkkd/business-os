"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useCompositeItemsPaginated } from "@/hooks/use-composite-items";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { TableLoadingSkeleton } from "@/components/table-loading-skeleton";
import { Paginated } from "@/components/paginated";
import { SearchBox } from "@/components/search-box";
import { isArrayWithValues } from "@/lib/is-array-with-values";
import { ListTree, Pencil } from "lucide-react";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

export default function CompositeItemsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const orgId = params?.orgId as string;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const searchFromUrl = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);

  useEffect(() => setSearchInput(searchFromUrl), [searchFromUrl]);

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

  const { data, isLoading, isRefetching } = useCompositeItemsPaginated(
    orgId,
    { page, pageSize, search: search.trim() || undefined },
    { enabled: !!orgId && mounted }
  );

  const tableData = data ?? { items: [], total: 0, page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE };
  const totalPages = Math.max(1, Math.ceil(tableData.total / tableData.pageSize));
  const from = tableData.total === 0 ? 0 : (tableData.page - 1) * tableData.pageSize + 1;
  const to = Math.min(tableData.page * tableData.pageSize, tableData.total);

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-md font-semibold">Composite Items</h1>
          <p className="text-muted-foreground text-xs">
            Kits and bundles made from multiple inventory items.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SearchBox
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search..."
            className="w-48"
          />
          <Button size="sm" asChild>
            <Link href={`/${orgId}/inventory/composite-items/new`}>
              <ListTree className="size-3.5" />
              Create
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          {tableData.total === 0 ? "No composite items" : `Showing ${from}–${to} of ${tableData.total}`}
        </p>
        {isLoading || isRefetching ? (
          <TableLoadingSkeleton columnCount={4} rowCount={8} compact />
        ) : isArrayWithValues(tableData.items) ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="h-8 px-3 text-xs">Name</TableHead>
                  <TableHead className="h-8 px-3 text-xs">Inventory item</TableHead>
                  <TableHead className="h-8 px-3 text-xs w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.items.map((comp) => (
                  <TableRow key={comp.id} className="[&_td]:py-1.5 [&_td]:px-3 [&_td]:text-xs">
                    <TableCell>{comp.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {(comp as { item_name?: string }).item_name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-xs" asChild>
                        <Link href={`/${orgId}/inventory/composite-items/${comp.id}`}>
                          <Pencil className="size-3" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="No composite items"
            description="Create a kit or bundle from inventory items."
            icon={ListTree}
            action={
              <Button size="sm" asChild>
                <Link href={`/${orgId}/inventory/composite-items/new`}>Create composite</Link>
              </Button>
            }
          />
        )}
        <Paginated
          pathname={pathname}
          page={tableData.page}
          pageSize={tableData.pageSize}
          totalPages={totalPages}
          defaultPageSize={10}
          params={search ? { search } : {}}
        />
      </div>
    </div>
  );
}
