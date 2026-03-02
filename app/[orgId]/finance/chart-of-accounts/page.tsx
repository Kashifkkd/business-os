"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useFinanceAccounts } from "@/hooks/use-finance-accounts";
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

export default function ChartOfAccountsPage() {
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
    (updates: { page?: number; search?: string; type?: string }) => {
      const next = new URLSearchParams(searchParams.toString());
      if (updates.page !== undefined) {
        if (updates.page > 1) next.set("page", String(updates.page));
        else next.delete("page");
      }
      if (updates.search !== undefined) {
        if (updates.search) next.set("search", updates.search);
        else next.delete("search");
      }
      if (updates.type !== undefined) {
        if (updates.type) next.set("type", updates.type);
        else next.delete("type");
      }
      router.push(`${pathname}${next.toString() ? `?${next}` : ""}`);
    },
    [pathname, router, searchParams]
  );

  const setParamsRef = useRef(setParams);
  useEffect(() => {
    setParamsRef.current = setParams;
  }, [setParams]);
  useEffect(() => {
    if (debouncedSearch.trim() === searchFromUrl.trim()) return;
    setParamsRef.current({ search: debouncedSearch.trim() || undefined, page: 1 });
  }, [debouncedSearch, searchFromUrl]);

  const page = Math.max(1, Number(searchParams.get("page")) || DEFAULT_PAGE);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE));
  const search = searchParams.get("search") ?? "";
  const type = searchParams.get("type") ?? "";

  const { data, isLoading, isRefetching } = useFinanceAccounts(
    orgId,
    { page, pageSize, search: search.trim() || undefined, type: type || undefined },
    { enabled: !!orgId && mounted }
  );

  const tableData = data ?? { items: [], total: 0, page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE };

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-md font-semibold">Chart of Accounts</h1>
          <p className="text-muted-foreground text-xs">
            GL accounts for double-entry bookkeeping.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SearchBox
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search by code or name..."
            className="w-56 sm:w-64"
          />
          <Button size="sm" asChild>
            <Link href={`/${orgId}/finance/chart-of-accounts/new`}>
              <Plus className="size-3.5" />
              Add account
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <TableLoadingSkeleton columnCount={5} rowCount={5} />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState
                        title="No accounts"
                        description="Add your first GL account to get started."
                        action={
                          <Button size="sm" asChild>
                            <Link href={`/${orgId}/finance/chart-of-accounts/new`}>Add account</Link>
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  tableData.items.map((account: { id: string; code: string; name: string; type: string; is_active: boolean }) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono text-sm">{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{account.type}</Badge>
                      </TableCell>
                      <TableCell>{account.is_active ? "Active" : "Inactive"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/${orgId}/finance/chart-of-accounts/${account.id}`}>Edit</Link>
                        </Button>
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
                Showing {(tableData.page - 1) * tableData.pageSize + 1}–
                {Math.min(tableData.page * tableData.pageSize, tableData.total)} of {tableData.total}
              </span>
              <Paginated
                pathname={pathname}
                page={tableData.page}
                pageSize={tableData.pageSize}
                totalPages={Math.max(1, Math.ceil(tableData.total / tableData.pageSize))}
                params={{ ...(search && { search }), ...(type && { type }) }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
