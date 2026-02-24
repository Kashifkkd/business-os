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
import { NameDisplay } from "@/components/name-display";
import { DateDisplay } from "@/components/date-display";
import { Paginated } from "@/components/paginated";
import { formatPrice, truncate } from "@/lib/format";
import type { MenuItem } from "@/lib/supabase/types";
import type { GetMenuItemsPaginatedResult } from "@/lib/supabase/queries";
import { Filter, Plus, Pencil, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { isArrayWithValues } from "@/lib/is-array-with-values";

const columnHelper = createColumnHelper<MenuItem>();

type MenuItemsTableProps = {
  orgId: string;
  data: GetMenuItemsPaginatedResult;
  searchParams: { page?: string; pageSize?: string; search?: string };
  isLoading?: boolean;
  isRefetching?: boolean;
};

export function MenuItemsTable({
  orgId,
  data,
  searchParams,
  isLoading = false,
  isRefetching = false,
}: MenuItemsTableProps) {
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
        cell: (ctx) => {
          const row = ctx.row.original;
          return (
            <NameDisplay
              name={row.name}
              avatarUrl={row.images?.[0]}
              icon={row.images?.length ? undefined : <Utensils className="size-3.5" />}
              iconOnly={!row.images?.length}
              size="sm"
            />
          );
        },
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (ctx) => (
          <span className="max-w-[140px] truncate text-muted-foreground">
            {truncate(ctx.getValue(), 40)}
          </span>
        ),
      }),
      columnHelper.accessor("long_description", {
        header: "Long description",
        cell: (ctx) => (
          <span className="max-w-[160px] truncate text-muted-foreground">
            {truncate(ctx.getValue(), 50)}
          </span>
        ),
      }),
      columnHelper.accessor("price", {
        header: () => <span className="text-right">Price</span>,
        cell: (ctx) => (
          <span className="tabular-nums text-right">
            {formatPrice(ctx.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("discounted_price", {
        header: () => <span className="text-right">Disc. price</span>,
        cell: (ctx) => (
          <span className="tabular-nums text-right">
            {ctx.getValue() != null
              ? formatPrice(ctx.getValue())
              : "—"}
          </span>
        ),
      }),
      columnHelper.accessor("category", {
        header: "Category",
        cell: (ctx) => (
          <span className="text-muted-foreground">
            {ctx.getValue() ?? "—"}
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
      columnHelper.accessor("created_at", {
        header: "Added",
        cell: (ctx) => (
          <DateDisplay
            value={ctx.getValue()}
            variant="timeAgo"
            layout="column"
          />
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button variant="ghost" size="icon-xs" asChild>
            <a href={`/${orgId}/menu/items/${row.original.id}`}>
              <Pencil className="size-3" />
              <span className="sr-only">Edit</span>
            </a>
          </Button>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: data.items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {total === 0
            ? "No menu items"
            : `Showing ${from}–${to} of ${total} menu`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="size-3.5" />
            Filters
          </Button>
          <Button size="sm" asChild>
            <a href={`/${orgId}/menu/items/new`}>
              <Plus className="size-3.5" />
              Create
            </a>
          </Button>
        </div>
      </div>

      {/* Loading | Table | Empty state */}
      {isLoading || isRefetching ? (
        <TableLoadingSkeleton columnCount={9} rowCount={10} compact />
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
                    <TableHead
                      key={header.id}
                      className="h-8 px-3 text-xs"
                    >
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
          title={searchParams.search ? "No results for your search" : "No menu items"}
          description={
            searchParams.search
              ? "Try a different search term or clear the search."
              : "Add your first item to get started."
          }
          icon={Utensils}
          action={
            searchParams.search ? undefined : (
              <Button size="sm" asChild>
                <a href={`/${orgId}/menu/items/new`}>
                  <Plus className="size-3.5" />
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
