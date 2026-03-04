"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useInventoryBillsPaginated } from "@/hooks/use-inventory-bills";
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
import { Badge } from "@/components/ui/badge";
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
import { formatPrice } from "@/lib/format";
import { isArrayWithValues } from "@/lib/is-array-with-values";
import { FileText, Pencil } from "lucide-react";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

export default function BillsPage() {
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
    (updates: { page?: number; search?: string; status?: string }) => {
      const next = new URLSearchParams(searchParams.toString());
      const p = updates.page ?? Math.max(1, Number(searchParams.get("page")) || 1);
      const s = updates.search ?? searchParams.get("search") ?? "";
      const st = updates.status ?? searchParams.get("status") ?? "";
      if (p > 1) next.set("page", String(p));
      else next.delete("page");
      if (s) next.set("search", s);
      else next.delete("search");
      if (st) next.set("status", st);
      else next.delete("status");
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
  const status = searchParams.get("status") ?? "";

  const { data, isLoading, isRefetching } = useInventoryBillsPaginated(
    orgId,
    { page, pageSize, search: search.trim() || undefined, status: status || undefined },
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
          <h1 className="text-md font-semibold">Vendor Bills</h1>
          <p className="text-muted-foreground text-xs">
            Track and pay bills from vendors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SearchBox
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Bill #..."
            className="w-40"
          />
          <Select
            value={status || "all"}
            onValueChange={(v) => setParams({ status: v === "all" ? "" : v, page: 1 })}
          >
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" asChild>
            <Link href={`/${orgId}/inventory/bills/new`}>
              <FileText className="size-3.5" />
              Create
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          {tableData.total === 0 ? "No bills" : `Showing ${from}–${to} of ${tableData.total}`}
        </p>
        {isLoading || isRefetching ? (
          <TableLoadingSkeleton columnCount={6} rowCount={8} compact />
        ) : isArrayWithValues(tableData.items) ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="h-8 px-3 text-xs">Bill #</TableHead>
                  <TableHead className="h-8 px-3 text-xs">Vendor</TableHead>
                  <TableHead className="h-8 px-3 text-xs">Date</TableHead>
                  <TableHead className="h-8 px-3 text-xs">Due</TableHead>
                  <TableHead className="h-8 px-3 text-xs">Status</TableHead>
                  <TableHead className="h-8 px-3 text-xs text-right">Amount</TableHead>
                  <TableHead className="h-8 px-3 text-xs w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.items.map((bill) => (
                  <TableRow key={bill.id} className="[&_td]:py-1.5 [&_td]:px-3 [&_td]:text-xs">
                    <TableCell>{bill.bill_number ?? "—"}</TableCell>
                    <TableCell>{bill.vendor_name ?? "—"}</TableCell>
                    <TableCell>{bill.bill_date}</TableCell>
                    <TableCell>{bill.due_date ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        {bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPrice(bill.amount)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-xs" asChild>
                        <Link href={`/${orgId}/inventory/bills/${bill.id}`}>
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
            title="No bills"
            description="Add a vendor bill to track payables."
            icon={FileText}
            action={
              <Button size="sm" asChild>
                <Link href={`/${orgId}/inventory/bills/new`}>Create bill</Link>
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
          params={{
            ...(search ? { search } : {}),
            ...(status ? { status } : {}),
          }}
        />
      </div>
    </div>
  );
}
