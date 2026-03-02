"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
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
import { Paginated } from "@/components/paginated";
import { formatPrice } from "@/lib/format";
import type { InventoryItem } from "@/lib/supabase/types";
import type { GetInventoryItemsResult } from "@/lib/supabase/queries";
import { Package, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { isArrayWithValues } from "@/lib/is-array-with-values";

const columnHelper = createColumnHelper<InventoryItem>();

type InventoryItemsTableProps = {
  orgId: string;
  data: GetInventoryItemsResult;
  searchParams: { page?: string; pageSize?: string; search?: string };
  isLoading?: boolean;
  isRefetching?: boolean;
};

export function InventoryItemsTable({
  orgId,
  data,
  searchParams,
  isLoading = false,
  isRefetching = false,
}: InventoryItemsTableProps) {
  const pathname = usePathname();
  const page = data.page;
  const pageSize = data.pageSize;
  const total = data.total;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (ctx) => (
          <div className="flex items-center gap-2">
            <Package className="size-3.5 text-muted-foreground" />
            <span>{ctx.getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor("sku", {
        header: "SKU",
        cell: (ctx) => (
          <span className="text-muted-foreground">
            {ctx.getValue() ?? "—"}
          </span>
        ),
      }),
      columnHelper.accessor("unit", {
        header: "Unit",
        cell: (ctx) => (
          <span className="text-muted-foreground">
            {ctx.getValue() ?? "—"}
          </span>
        ),
      }),
      columnHelper.accessor("cost", {
        header: () => <span className="text-right">Cost</span>,
        cell: (ctx) => (
          <span className="tabular-nums text-right">
            {ctx.getValue() != null ? formatPrice(ctx.getValue()) : "—"}
          </span>
        ),
      }),
      columnHelper.accessor("selling_price", {
        header: () => <span className="text-right">Selling Price</span>,
        cell: (ctx) => (
          <span className="tabular-nums text-right">
            {ctx.getValue() != null ? formatPrice(ctx.getValue()) : "—"}
          </span>
        ),
      }),
      columnHelper.accessor("reorder_level", {
        header: () => <span className="text-right">Reorder</span>,
        cell: (ctx) => (
          <span className="tabular-nums text-right">
            {ctx.getValue() != null ? String(ctx.getValue()) : "—"}
          </span>
        ),
      }),
      columnHelper.accessor("is_active", {
        header: "Status",
        cell: (ctx) => (
          <Badge
            variant={ctx.getValue() ? "default" : "secondary"}
            className={cn(
              "text-[10px] font-normal",
              !ctx.getValue() && "opacity-70"
            )}
          >
            {ctx.getValue() ? "Active" : "Inactive"}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button variant="ghost" size="icon-xs" asChild>
            <a href={`/${orgId}/inventory/items/${row.original.id}`}>
              <Pencil className="size-3" />
              <span className="sr-only">Edit</span>
            </a>
          </Button>
        ),
      }),
    ],
    [orgId]
  );

  const table = useReactTable({
    data: data.items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {total === 0
            ? "No inventory items"
            : `Showing ${from}–${to} of ${total} items`}
        </p>
        <Button size="sm" asChild>
          <a href={`/${orgId}/inventory/items/new`}>
            Create
          </a>
        </Button>
      </div>

      {isLoading || isRefetching ? (
        <TableLoadingSkeleton columnCount={8} rowCount={10} compact />
      ) : isArrayWithValues(data.items) ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-muted/50 hover:bg-muted/50"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-8 px-3 text-xs">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="[&_td]:py-1.5 [&_td]:px-3 [&_td]:text-xs"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title={searchParams.search ? "No results for your search" : "No inventory items"}
          description={
            searchParams.search
              ? "Try a different search term or clear the search."
              : "Add your first item to get started."
          }
          icon={Package}
          action={
            searchParams.search ? undefined : (
              <Button size="sm" asChild>
                <a href={`/${orgId}/inventory/items/new`}>
                  Create item
                </a>
              </Button>
            )
          }
        />
      )}

      <Paginated
        pathname={pathname}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        defaultPageSize={10}
        params={searchParams.search ? { search: searchParams.search } : {}}
      />
    </div>
  );
}
