"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useFinanceExpenses } from "@/hooks/use-finance-expenses";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { TableLoadingSkeleton } from "@/components/table-loading-skeleton";
import { Paginated } from "@/components/paginated";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

export default function FinanceExpensesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const orgId = params?.orgId as string;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const page = Math.max(1, Number(searchParams.get("page")) || DEFAULT_PAGE);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE));
  const status = searchParams.get("status") ?? "";

  const { data, isLoading } = useFinanceExpenses(
    orgId,
    { page, pageSize, status: status || undefined },
    { enabled: !!orgId && mounted }
  );

  const tableData = data ?? { items: [], total: 0, page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE };

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4">
        <h1 className="text-md font-semibold">Expense reports</h1>
        <p className="text-muted-foreground text-xs">Employee expense reports.</p>
      </div>

      {isLoading ? (
        <TableLoadingSkeleton columnCount={5} rowCount={5} />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState title="No expense reports" description="Expense reports will appear here." />
                    </TableCell>
                  </TableRow>
                ) : (
                  tableData.items.map((r: { id: string; report_number: string; status: string; currency: string; total_amount: number }) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono">{r.report_number}</TableCell>
                      <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                      <TableCell>{r.currency}</TableCell>
                      <TableCell className="text-right">{Number(r.total_amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild><Link href={`/${orgId}/finance/expenses/${r.id}`}>View</Link></Button>
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
                params={{ ...(status && { status }) }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
