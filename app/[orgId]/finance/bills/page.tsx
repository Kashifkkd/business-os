"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useFinanceBills } from "@/hooks/use-finance-bills";
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

export default function FinanceBillsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const orgId = params?.orgId as string;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const page = Math.max(1, Number(searchParams.get("page")) || DEFAULT_PAGE);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE));
  const status = searchParams.get("status") ?? "";

  const { data, isLoading } = useFinanceBills(
    orgId,
    { page, pageSize, status: status || undefined },
    { enabled: !!orgId && mounted }
  );

  const tableData = data ?? { items: [], total: 0, page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE };

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4">
        <h1 className="text-md font-semibold">Bills</h1>
        <p className="text-muted-foreground text-xs">Vendor bills (AP).</p>
      </div>

      {isLoading ? (
        <TableLoadingSkeleton columnCount={5} rowCount={5} />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState title="No bills" description="Bills from vendors will appear here." />
                    </TableCell>
                  </TableRow>
                ) : (
                  tableData.items.map((bill: { id: string; bill_number: string | null; bill_date: string; status: string; amount: number }) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-mono">{bill.bill_number ?? bill.id.slice(0, 8)}</TableCell>
                      <TableCell>{bill.bill_date}</TableCell>
                      <TableCell><Badge variant="secondary">{bill.status}</Badge></TableCell>
                      <TableCell className="text-right">{Number(bill.amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild><Link href={`/${orgId}/finance/bills/${bill.id}`}>View</Link></Button>
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
