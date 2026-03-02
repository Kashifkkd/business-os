"use client";

import { useParams } from "next/navigation";
import { useFinanceReportBalanceSheet } from "@/hooks/use-finance-reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BalanceSheetReportPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const asOfDate = new Date().toISOString().slice(0, 10);
  const { data, isLoading } = useFinanceReportBalanceSheet(orgId, asOfDate);

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/${orgId}/finance/reports`}><ArrowLeft className="size-3.5" /> Back</Link>
      </Button>
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Balance Sheet</h2>
          <p className="text-muted-foreground text-xs">As of {data?.as_of ?? asOfDate}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : (
            <>
              <div>
                <h3 className="text-xs font-medium text-muted-foreground">Total assets</h3>
                <p className="text-lg font-semibold">{(data?.total_assets ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-muted-foreground">Total liabilities & equity</h3>
                <p className="text-lg font-semibold">{(data?.total_liabilities_equity ?? 0).toLocaleString()}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
