"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useInventoryAnalytics } from "@/hooks/use-inventory-analytics";
import { formatPrice } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchBox } from "@/components/search-box";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { BarChart3, Download, Package, ArrowRightLeft, AlertTriangle } from "lucide-react";

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const escape = (v: string) => {
    const s = String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const line = (row: string[]) => row.map(escape).join(",");
  const csv = [line(headers), ...rows.map((r) => line(r))].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const { data: analytics, isLoading } = useInventoryAnalytics(orgId);

  const [valuationWarehouseFilter, setValuationWarehouseFilter] = useState<string>("all");
  const [valuationSearch, setValuationSearch] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>("all");

  const valuationRows = useMemo(() => {
    const report = analytics?.stock_valuation_report ?? [];
    let filtered = report;
    if (valuationWarehouseFilter !== "all") {
      filtered = filtered.filter((r) => r.warehouse_id === valuationWarehouseFilter);
    }
    if (valuationSearch.trim()) {
      const q = valuationSearch.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.item_name.toLowerCase().includes(q) ||
          (r.sku?.toLowerCase().includes(q) ?? false)
      );
    }
    return filtered;
  }, [analytics?.stock_valuation_report, valuationWarehouseFilter, valuationSearch]);

  const movementRows = useMemo(() => {
    const movements = analytics?.recent_movements ?? [];
    if (movementTypeFilter === "all") return movements;
    return movements.filter((m) => m.movement_type === movementTypeFilter);
  }, [analytics?.recent_movements, movementTypeFilter]);

  const warehouseOptions = useMemo(() => {
    const report = analytics?.stock_valuation_report ?? [];
    const ids = new Map<string, string>();
    for (const r of report) {
      ids.set(r.warehouse_id, r.warehouse_name || r.warehouse_id);
    }
    return Array.from(ids.entries()).map(([id, name]) => ({ id, name }));
  }, [analytics?.stock_valuation_report]);

  const movementTypes = useMemo(() => {
    const movements = analytics?.recent_movements ?? [];
    const set = new Set(movements.map((m) => m.movement_type).filter(Boolean));
    return Array.from(set).sort();
  }, [analytics?.recent_movements]);

  const valuationTotal = useMemo(
    () => valuationRows.reduce((sum, r) => sum + r.value, 0),
    [valuationRows]
  );

  const handleExportValuation = () => {
    const headers = ["Item", "SKU", "Warehouse", "Quantity", "Unit cost", "Value"];
    const rows = valuationRows.map((r) => [
      r.item_name,
      r.sku ?? "",
      r.warehouse_name,
      String(r.quantity),
      String(r.unit_cost),
      String(r.value),
    ]);
    downloadCsv("stock-valuation-report.csv", headers, rows);
  };

  const handleExportMovements = () => {
    const headers = ["Date", "Item", "Warehouse", "Type", "Quantity"];
    const rows = movementRows.map((m) => [
      formatDateTime(m.created_at),
      m.item_name,
      m.warehouse_name,
      m.movement_type,
      String(m.quantity),
    ]);
    downloadCsv("inventory-movements.csv", headers, rows);
  };

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4 space-y-6">
      <div>
        <h1 className="text-md font-semibold">Inventory Reports</h1>
        <p className="text-muted-foreground text-xs">
          Stock valuation, movement history, and low stock.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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
                <BarChart3 className="size-4" />
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
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="size-4" />
                Low Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{analytics?.low_stock_count ?? 0}</p>
              <p className="text-muted-foreground text-xs">Items below reorder level</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Package className="size-4" />
                Stock Value
              </CardTitle>
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

      {/* Stock Valuation Report */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Stock Valuation Report</CardTitle>
              <CardDescription>
                Inventory value by item and warehouse. Filter and export below.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SearchBox
                value={valuationSearch}
                onChange={setValuationSearch}
                placeholder="Search item or SKU..."
                className="w-44 h-8 text-xs"
              />
              <Select
                value={valuationWarehouseFilter}
                onValueChange={setValuationWarehouseFilter}
              >
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder="Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All warehouses</SelectItem>
                  {warehouseOptions.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportValuation}
                disabled={valuationRows.length === 0}
              >
                <Download className="size-3.5" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : valuationRows.length === 0 ? (
            <EmptyState
              title="No valuation data"
              description={
                valuationSearch || valuationWarehouseFilter !== "all"
                  ? "No rows match the current filters."
                  : "Add inventory items and stock levels to see valuation."
              }
              icon={Package}
            />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="h-8 px-3 text-xs">Item</TableHead>
                      <TableHead className="h-8 px-3 text-xs">SKU</TableHead>
                      <TableHead className="h-8 px-3 text-xs">Warehouse</TableHead>
                      <TableHead className="h-8 px-3 text-xs text-right">Quantity</TableHead>
                      <TableHead className="h-8 px-3 text-xs text-right">Unit cost</TableHead>
                      <TableHead className="h-8 px-3 text-xs text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {valuationRows.map((r, i) => (
                      <TableRow key={`${r.item_id}-${r.warehouse_id}-${i}`} className="[&_td]:py-1.5 [&_td]:px-3 [&_td]:text-xs">
                        <TableCell className="font-medium">{r.item_name}</TableCell>
                        <TableCell className="text-muted-foreground">{r.sku ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{r.warehouse_name}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.quantity}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatPrice(r.unit_cost)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatPrice(r.value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-2 text-muted-foreground text-xs">
                Showing {valuationRows.length} row{valuationRows.length !== 1 ? "s" : ""}
                {valuationWarehouseFilter !== "all" || valuationSearch ? " (filtered)" : ""}.
                Total value: {formatPrice(valuationTotal)}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Movement history */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="size-4" />
                Movement History
              </CardTitle>
              <CardDescription>
                Recent stock movements (adjustments, transfers, receipts). Last 100.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {movementTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportMovements}
                disabled={movementRows.length === 0}
              >
                <Download className="size-3.5" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : movementRows.length === 0 ? (
            <EmptyState
              title="No movements"
              description={
                movementTypeFilter !== "all"
                  ? "No movements match the selected type."
                  : "Stock movements will appear here when you receive, adjust, or transfer inventory."
              }
              icon={ArrowRightLeft}
            />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="h-8 px-3 text-xs">Date</TableHead>
                      <TableHead className="h-8 px-3 text-xs">Item</TableHead>
                      <TableHead className="h-8 px-3 text-xs">Warehouse</TableHead>
                      <TableHead className="h-8 px-3 text-xs">Type</TableHead>
                      <TableHead className="h-8 px-3 text-xs text-right">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movementRows.map((m) => (
                      <TableRow key={m.id} className="[&_td]:py-1.5 [&_td]:px-3 [&_td]:text-xs">
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {formatDateTime(m.created_at)}
                        </TableCell>
                        <TableCell>{m.item_name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{m.warehouse_name || "—"}</TableCell>
                        <TableCell>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                            {m.movement_type}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {m.quantity > 0 ? "+" : ""}{m.quantity}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-2 text-muted-foreground text-xs">
                Showing {movementRows.length} movement{movementRows.length !== 1 ? "s" : ""}
                {movementTypeFilter !== "all" ? " (filtered)" : ""}.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Low stock items */}
      {(analytics?.low_stock_items?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="size-4" />
              Low Stock Items
            </CardTitle>
            <CardDescription>
              Items at or below reorder level. Consider restocking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="h-8 px-3 text-xs">Item</TableHead>
                    <TableHead className="h-8 px-3 text-xs">SKU</TableHead>
                    <TableHead className="h-8 px-3 text-xs text-right">Reorder level</TableHead>
                    <TableHead className="h-8 px-3 text-xs text-right">Current qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(analytics?.low_stock_items ?? []).map((item) => (
                    <TableRow key={item.id} className="[&_td]:py-1.5 [&_td]:px-3 [&_td]:text-xs">
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.sku ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.reorder_level ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-amber-600 dark:text-amber-500">
                        {item.total_quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
