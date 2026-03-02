"use client";

import { useParams } from "next/navigation";
import { useWarehouses } from "@/hooks/use-warehouses";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { TableLoadingSkeleton } from "@/components/table-loading-skeleton";
import { Warehouse, Pencil, Plus } from "lucide-react";
import { isArrayWithValues } from "@/lib/is-array-with-values";
import Link from "next/link";

export default function WarehousesPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const { data: warehouses, isLoading } = useWarehouses(orgId);

  if (!orgId) return null;

  const items = warehouses ?? [];

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-md font-semibold">Warehouses</h1>
          <p className="text-muted-foreground text-xs">
            Stock locations for multi-warehouse inventory.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href={`/${orgId}/inventory/warehouses/new`}>
            <Plus className="size-3.5" />
            Create
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <TableLoadingSkeleton columnCount={5} rowCount={5} compact />
      ) : isArrayWithValues(items) ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="h-8 px-3 text-xs">Name</TableHead>
                <TableHead className="h-8 px-3 text-xs">Code</TableHead>
                <TableHead className="h-8 px-3 text-xs">Default</TableHead>
                <TableHead className="h-8 px-3 text-xs">Address</TableHead>
                <TableHead className="h-8 px-3 text-xs w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((w) => (
                <TableRow key={w.id} className="[&_td]:py-1.5 [&_td]:px-3 [&_td]:text-xs">
                  <TableCell>{w.name}</TableCell>
                  <TableCell className="text-muted-foreground">{w.code ?? "—"}</TableCell>
                  <TableCell>
                    {w.is_default && (
                      <Badge variant="secondary" className="text-[10px]">Default</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-muted-foreground">
                    {[w.address_line_1, w.city].filter(Boolean).join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-xs" asChild>
                      <Link href={`/${orgId}/inventory/warehouses/${w.id}`}>
                        <Pencil className="size-3" />
                        <span className="sr-only">Edit</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No warehouses"
          description="Create a warehouse to start tracking stock by location."
          icon={Warehouse}
          action={
            <Button size="sm" asChild>
              <Link href={`/${orgId}/inventory/warehouses/new`}>
                <Plus className="size-3.5" />
                Create warehouse
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
