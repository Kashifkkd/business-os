"use client";

import { useParams } from "next/navigation";
import { useFinanceReportPnL } from "@/hooks/use-finance-reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProfitAndLossReportPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const fromDate = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const toDate = new Date().toISOString().slice(0, 10);
  const { data, isLoading } = useFinanceReportPnL(orgId, fromDate, toDate);

  if (!orgId) return null;

  const income = data?.income as { accounts?: Array<{ code: string; name: string; balance: number }>; total?: number } | undefined;
  const expense = data?.expense as { accounts?: Array<{ code: string; name: string; balance: number }>; total?: number } | undefined;
  const net = data?.net as number | undefined;

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/${orgId}/finance/reports`}><ArrowLeft className="size-3.5" /> Back</Link>
      </Button>
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Profit & Loss</h2>
          <p className="text-muted-foreground text-xs">
            {data?.from_date} to {data?.to_date}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : (
            <>
              {income && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground">Income</h3>
                  <p className="text-lg font-semibold">{(income.total ?? 0).toLocaleString()}</p>
                </div>
              )}
              {expense && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground">Expense</h3>
                  <p className="text-lg font-semibold">{(expense.total ?? 0).toLocaleString()}</p>
                </div>
              )}
              {net !== undefined && (
                <div className="border-t pt-2">
                  <h3 className="text-xs font-medium text-muted-foreground">Net</h3>
                  <p className="text-lg font-semibold">{net.toLocaleString()}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
