"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useFinanceInvoices } from "@/hooks/use-finance-invoices";
import { useDebounce } from "@/hooks/use-debounce";
import { SearchBox } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { TableLoadingSkeleton } from "@/components/table-loading-skeleton";
import { Paginated } from "@/components/paginated";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

export default function FinanceInvoicesPage() {
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
      if (updates.page !== undefined) (updates.page > 1 ? next.set("page", String(updates.page)) : next.delete("page"));
      if (updates.search !== undefined) (updates.search ? next.set("search", updates.search) : next.delete("search"));
      if (updates.status !== undefined) (updates.status ? next.set("status", updates.status) : next.delete("status"));
      router.push(`${pathname}${next.toString() ? `?${next}` : ""}`);
    },
    [pathname, router, searchParams]
  );
  const setParamsRef = useRef(setParams);
  useEffect(() => { setParamsRef.current = setParams; }, [setParams]);
  useEffect(() => {
    if (debouncedSearch.trim() === searchFromUrl.trim()) return;
    setParamsRef.current({ search: debouncedSearch.trim() || undefined, page: 1 });
  }, [debouncedSearch, searchFromUrl]);

  const page = Math.max(1, Number(searchParams.get("page")) || DEFAULT_PAGE);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE));
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";

  const { data, isLoading } = useFinanceInvoices(
    orgId,
    { page, pageSize, search: search.trim() || undefined, status: status || undefined },
    { enabled: !!orgId && mounted }
  );

  const tableData = data ?? { items: [], total: 0, page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE };

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-md font-semibold">Invoices</h1>
          <p className="text-muted-foreground text-xs">Sales invoices (AR).</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchBox value={searchInput} onChange={setSearchInput} placeholder="Search by number..." className="w-56 sm:w-64" />
          <Button size="sm" asChild>
            <Link href={`/${orgId}/finance/invoices/new`}><Plus className="size-3.5" /> New invoice</Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <TableLoadingSkeleton columnCount={6} rowCount={5} />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState
                        title="No invoices"
                        description="Create an invoice to get started."
                        action={<Button size="sm" asChild><Link href={`/${orgId}/finance/invoices/new`}>New invoice</Link></Button>}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  tableData.items.map((inv: { id: string; invoice_number: string; invoice_date: string; status: string; total: number; balance: number }) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.invoice_date}</TableCell>
                      <TableCell><Badge variant="secondary">{inv.status}</Badge></TableCell>
                      <TableCell className="text-right">{Number(inv.total).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Number(inv.balance).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild><Link href={`/${orgId}/finance/invoices/${inv.id}`}>View</Link></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {tableData.total > tableData.pageSize && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Showing {(tableData.page - 1) * tableData.pageSize + 1}–{Math.min(tableData.page * tableData.pageSize, tableData.total)} of {tableData.total}
              </span>
              <Paginated
                pathname={pathname}
                page={tableData.page}
                pageSize={tableData.pageSize}
                totalPages={Math.max(1, Math.ceil(tableData.total / tableData.pageSize))}
                params={{ ...(search && { search }), ...(status && { status }) }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
