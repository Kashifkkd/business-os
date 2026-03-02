"use client";

import { useParams } from "next/navigation";
import { useFinanceReportTrialBalance } from "@/hooks/use-finance-reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TrialBalanceReportPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const fromDate = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const toDate = new Date().toISOString().slice(0, 10);
  const { data, isLoading } = useFinanceReportTrialBalance(orgId, fromDate, toDate);

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/${orgId}/finance/reports`}><ArrowLeft className="size-3.5" /> Back</Link>
      </Button>
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Trial Balance</h2>
          <p className="text-muted-foreground text-xs">
            {data?.from_date} to {data?.to_date}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.rows as Array<{ account_code: string; account_name: string; account_type: string; debit: number; credit: number; balance: number }>)?.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono">{row.account_code}</TableCell>
                      <TableCell>{row.account_name}</TableCell>
                      <TableCell>{row.account_type}</TableCell>
                      <TableCell className="text-right">{Number(row.debit).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Number(row.credit).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Number(row.balance).toLocaleString()}</TableCell>
                    </TableRow>
                  )) ?? null}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
