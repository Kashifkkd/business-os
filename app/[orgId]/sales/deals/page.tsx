"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useDeals, usePipelineStages } from "@/hooks/use-sales";
import { useDebounce } from "@/hooks/use-debounce";
import { useTenant } from "@/hooks/use-tenant";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Deal } from "@/lib/supabase/types";
import { Plus } from "lucide-react";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

function formatCurrency(value: number, symbol: string): string {
  return `${symbol}${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function DealsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const orgId = params?.orgId as string;
  const { tenant } = useTenant();
  const symbol = tenant?.currency_symbol ?? "$";

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const searchFromUrl = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  const setParams = useCallback(
    (updates: { page?: number; search?: string; stage_id?: string }) => {
      const next = new URLSearchParams(searchParams.toString());
      const p = updates.page ?? Math.max(1, Number(searchParams.get("page")) || 1);
      const s = updates.search ?? searchParams.get("search") ?? "";
      const stageId = updates.stage_id ?? searchParams.get("stage_id") ?? "";
      if (p > 1) next.set("page", String(p));
      else next.delete("page");
      if (s) next.set("search", s);
      else next.delete("search");
      if (stageId) next.set("stage_id", stageId);
      else next.delete("stage_id");
      const q = next.toString();
      router.push(`${pathname}${q ? `?${q}` : ""}`);
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
  const stageId = searchParams.get("stage_id") ?? "";

  const { data, isLoading, isRefetching } = useDeals(orgId, {
    page,
    pageSize,
    search: search.trim() || undefined,
    stage_id: stageId || undefined,
  }, { enabled: !!orgId && mounted });

  const { data: stages } = usePipelineStages(orgId);
  const stageMap = new Map((stages ?? []).map((s) => [s.id, s.name]));

  const tableData = data ?? { items: [], total: 0, page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE };
  const totalPages = Math.max(1, Math.ceil(tableData.total / tableData.pageSize));

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Deals</h1>
          <p className="text-muted-foreground text-sm">
            All deals and opportunities.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href={`/${orgId}/sales/deals/new`}>
            <Plus className="size-3.5" />
            New deal
          </Link>
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchBox
          value={searchInput}
          onChange={setSearchInput}
          className={"w-48"}
          placeholder="Search deal..."
        />
        <Select
          value={stageId || "__all__"}
          onValueChange={(v) => setParams({ stage_id: v === "__all__" ? "" : v, page: 1 })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All stages</SelectItem>
            {(stages ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        {isLoading ? (
          <TableLoadingSkeleton rows={10} columns={6} />
        ) : tableData.items.length === 0 ? (
          <EmptyState
            title="No deals"
            description="Create a deal to get started."
            action={
              <Button size="sm" asChild>
                <Link href={`/${orgId}/sales/deals/new`}>
                  <Plus className="size-3.5" />
                  New deal
                </Link>
              </Button>
            }
            className="py-12"
          />
        ) : (
          <>
            <div className="border-b px-3 py-2 text-muted-foreground text-sm">
              {tableData.total === 0
                ? "No deals"
                : `Showing ${(tableData.page - 1) * tableData.pageSize + 1}–${Math.min(tableData.page * tableData.pageSize, tableData.total)} of ${tableData.total}`}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Expected close</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.items.map((deal: Deal) => (
                  <TableRow key={deal.id}>
                    <TableCell>
                      <Link
                        href={`/${orgId}/sales/deals/${deal.id}`}
                        className="font-medium hover:underline"
                      >
                        {deal.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(deal.value, symbol)}
                    </TableCell>
                    <TableCell>{stageMap.get(deal.stage_id) ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {deal.expected_close_date ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/${orgId}/sales/deals/${deal.id}/edit`}>Edit</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="border-t p-2">
                <Paginated
                  pathname={pathname}
                  page={tableData.page}
                  pageSize={tableData.pageSize}
                  totalPages={totalPages}
                  params={{ search, stage_id: stageId }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
