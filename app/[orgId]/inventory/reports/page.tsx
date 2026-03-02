"use client";

import { useParams } from "next/navigation";
import { useInventoryAnalytics } from "@/hooks/use-inventory-analytics";
import { formatPrice } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 as BarChartIcon } from "lucide-react";

export default function ReportsPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const { data: analytics, isLoading } = useInventoryAnalytics(orgId);

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4">
        <h1 className="text-md font-semibold">Inventory Reports</h1>
        <p className="text-muted-foreground text-xs">
          Stock valuation, movements, and low stock reports.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-7 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChartIcon className="size-4" />
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{analytics?.total_items ?? 0}</p>
              <p className="text-muted-foreground text-xs">Active inventory items</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Low Stock Count</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{analytics?.low_stock_count ?? 0}</p>
              <p className="text-muted-foreground text-xs">Items below reorder level</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Stock Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatPrice(analytics?.total_stock_value ?? 0)}
              </p>
              <p className="text-muted-foreground text-xs">Total at cost</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Stock Valuation Report</CardTitle>
          <CardDescription>
            Summary of inventory value by item and warehouse. Full export and filtering coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            The dashboard and reports page show key metrics. Movement history and detailed reports will be expanded in a future release.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
