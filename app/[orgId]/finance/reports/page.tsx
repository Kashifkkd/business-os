"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText, Wallet, TrendingUp } from "lucide-react";

export default function FinanceReportsPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const base = `/${orgId}/finance/reports`;

  const reports = [
    { href: `${base}/trial-balance`, label: "Trial Balance", icon: FileText, description: "All account balances for a date range" },
    { href: `${base}/profit-and-loss`, label: "Profit & Loss", icon: TrendingUp, description: "Income and expenses" },
    { href: `${base}/balance-sheet`, label: "Balance Sheet", icon: BarChart3, description: "Assets, liabilities, and equity as of a date" },
    { href: `${base}/cash-flow`, label: "Cash Flow", icon: Wallet, description: "Cash movement summary" },
  ];

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Reports</h1>
        <p className="text-muted-foreground text-sm">
          Financial reports from posted journal entries.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map(({ href, label, icon: Icon, description }) => (
          <Link key={href} href={href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Icon className="size-5 text-muted-foreground" />
                <CardTitle className="text-base">{label}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {description}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
