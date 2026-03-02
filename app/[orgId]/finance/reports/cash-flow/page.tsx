"use client";

import { useParams } from "next/navigation";
import { useFinanceReportCashFlow } from "@/hooks/use-finance-reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CashFlowReportPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const fromDate = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const toDate = new Date().toISOString().slice(0, 10);
  const { data, isLoading } = useFinanceReportCashFlow(orgId, fromDate, toDate);

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/${orgId}/finance/reports`}><ArrowLeft className="size-3.5" /> Back</Link>
      </Button>
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Cash Flow</h2>
          <p className="text-muted-foreground text-xs">
            {data?.from_date} to {data?.to_date}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground">Net change</h3>
              <p className="text-lg font-semibold">{(data?.net_change ?? 0).toLocaleString()}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
