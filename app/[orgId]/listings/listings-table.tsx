"use client";

import Link from "next/link";
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
import { DateDisplay } from "@/components/date-display";
import { Paginated } from "@/components/paginated";
import { formatPrice } from "@/lib/format";
import type { Listing } from "@/lib/supabase/types";
import type { GetListingsResult } from "@/lib/supabase/queries";
import { List, Plus, Pencil, Trash2 } from "lucide-react";
import { isArrayWithValues } from "@/lib/is-array-with-values";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<Listing>();

type ListingsTableProps = {
  orgId: string;
  data: GetListingsResult;
  searchParams: { page?: string; pageSize?: string; status?: string };
  isLoading?: boolean;
  isRefetching?: boolean;
  onDelete?: (listing: Listing) => void;
};

export function ListingsTable({
  orgId,
  data,
  searchParams,
  isLoading = false,
  isRefetching = false,
  onDelete,
}: ListingsTableProps) {
  const pathname = usePathname();
  const page = data.page;
  const pageSize = data.pageSize;
  const total = data.total;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Title",
        cell: (ctx) => (
          <span className="font-medium">{ctx.getValue() ?? "—"}</span>
        ),
      }),
      columnHelper.accessor("property_address", {
        header: "Property",
        cell: (ctx) => (
          <span className="text-muted-foreground">
            {ctx.getValue() ?? "—"}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (ctx) => {
          const status = ctx.getValue();
          const isPublished = status === "published";
          return (
            <Badge
              variant={isPublished ? "default" : "secondary"}
              className={cn("text-[10px] font-normal", !isPublished && "opacity-80")}
            >
              {status}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("price", {
        header: () => <span className="text-right">Price</span>,
        cell: (ctx) => (
          <span className="tabular-nums text-right">
            {formatPrice(ctx.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: "Created",
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
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" asChild>
              <Link href={`/${orgId}/listings/${row.original.id}`}>
                <Pencil className="size-3" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onDelete(row.original)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-3" />
                <span className="sr-only">Delete</span>
              </Button>
            )}
          </div>
        ),
      }),
    ],
    [orgId, onDelete]
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
            ? "No listings"
            : `Showing ${from}–${to} of ${total} listings`}
        </p>
        <Button size="sm" asChild>
          <Link href={`/${orgId}/listings/new`}>
            <Plus className="size-3.5" />
            Create
          </Link>
        </Button>
      </div>

      {isLoading || isRefetching ? (
        <TableLoadingSkeleton columnCount={6} rowCount={10} compact />
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
          title={searchParams.status ? "No listings for this status" : "No listings"}
          description={
            searchParams.status
              ? "Try a different status filter or create a new listing."
              : "Create your first listing linked to a property."
          }
          icon={List}
          action={
            !searchParams.status ? (
              <Button size="sm" asChild>
                <Link href={`/${orgId}/listings/new`}>
                  <Plus className="size-3.5" />
                  Create listing
                </Link>
              </Button>
            ) : undefined
          }
        />
      )}

      <Paginated
        pathname={pathname}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        defaultPageSize={10}
        params={
          searchParams.status
            ? { status: searchParams.status }
            : undefined
        }
      />
    </div>
  );
}
