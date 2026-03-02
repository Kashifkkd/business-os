"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, ReceiptText, FileText, Wallet, BookOpen, BarChart3 } from "lucide-react";

export default function FinanceDashboardPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const base = `/${orgId}/finance`;

  const quickLinks = [
    { href: `${base}/chart-of-accounts`, label: "Chart of Accounts", icon: BookOpen },
    { href: `${base}/invoices`, label: "Invoices", icon: ReceiptText },
    { href: `${base}/bills`, label: "Bills", icon: FileText },
    { href: `${base}/expenses`, label: "Expenses", icon: Wallet },
    { href: `${base}/banking`, label: "Banking", icon: Landmark },
    { href: `${base}/reports`, label: "Reports", icon: BarChart3 },
  ];

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Finance</h1>
        <p className="text-muted-foreground text-sm">
          General ledger, AR, AP, expenses, banking, and reports.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Icon className="size-5 text-muted-foreground" />
                <CardTitle className="text-base">{label}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                View and manage {label.toLowerCase()}.
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
