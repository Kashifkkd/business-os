"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useFinanceBankAccounts } from "@/hooks/use-finance-bank-accounts";
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

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

export default function FinanceBankingPage() {
  const params = useParams();
  const pathname = usePathname();
  const orgId = params?.orgId as string;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const page = 1;
  const pageSize = 50;

  const { data, isLoading } = useFinanceBankAccounts(
    orgId,
    { page, pageSize },
    { enabled: !!orgId && mounted }
  );

  const tableData = data ?? { items: [], total: 0, page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE };

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4">
        <h1 className="text-md font-semibold">Bank accounts</h1>
        <p className="text-muted-foreground text-xs">Bank accounts linked to GL for reconciliation.</p>
      </div>

      {isLoading ? (
        <TableLoadingSkeleton columnCount={4} rowCount={5} />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EmptyState
                      title="No bank accounts"
                      description="Add a bank account and link it to a GL account."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                tableData.items.map((acc: { id: string; name: string; institution: string | null; currency: string }) => (
                  <TableRow key={acc.id}>
                    <TableCell>{acc.name}</TableCell>
                    <TableCell className="text-muted-foreground">{acc.institution ?? "—"}</TableCell>
                    <TableCell>{acc.currency}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/${orgId}/finance/banking/${acc.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
