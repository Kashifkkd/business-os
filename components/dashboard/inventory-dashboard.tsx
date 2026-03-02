"use client";

import { useInventoryAnalytics } from "@/hooks/use-inventory-analytics";
import { formatPrice } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface InventoryDashboardProps {
  orgId: string;
}

export function InventoryDashboard({ orgId }: InventoryDashboardProps) {
  const { data: analytics, isLoading } = useInventoryAnalytics(orgId);

  if (!orgId) return null;

  if (isLoading || !analytics) {
    return (
      <div className="container mx-auto max-w-6xl p-4">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Inventory Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Overview of stock, low stock alerts, and recent movements.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-7 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Inventory Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Overview of stock, low stock alerts, and recent movements.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_items}</div>
            <p className="text-muted-foreground text-xs">Active inventory items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.low_stock_count}</div>
            <p className="text-muted-foreground text-xs">Items below reorder level</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(analytics.total_stock_value)}
            </div>
            <p className="text-muted-foreground text-xs">Total inventory value at cost</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Movements</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.recent_movements.length}</div>
            <p className="text-muted-foreground text-xs">Last 10 stock changes</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>Items at or below reorder level</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.low_stock_items.length === 0 ? (
              <p className="text-muted-foreground text-sm">No low stock items.</p>
            ) : (
              <ul className="space-y-2">
                {analytics.low_stock_items.slice(0, 10).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-md border p-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{item.name}</span>
                      {item.sku && (
                        <span className="ml-2 text-muted-foreground">({item.sku})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {item.total_quantity} / {item.reorder_level ?? "—"}
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/${orgId}/inventory/items/${item.id}`}>View</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Stock Movements</CardTitle>
            <CardDescription>Latest adjustments and transfers</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.recent_movements.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent movements.</p>
            ) : (
              <ul className="space-y-2">
                {analytics.recent_movements.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-md border p-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{m.item_name}</span>
                      <span className="ml-2 text-muted-foreground">@ {m.warehouse_name}</span>
                    </div>
                    <span
                      className={
                        m.quantity > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {m.quantity > 0 ? "+" : ""}
                      {m.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
