"use client";

import Link from "next/link";
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
import { EmptyState } from "@/components/empty-state";
import { TableLoadingSkeleton } from "@/components/table-loading-skeleton";
import { Paginated } from "@/components/paginated";
import { DateDisplay } from "@/components/date-display";
import { SearchBox } from "@/components/search-box";
import type { MarketingSegment } from "@/lib/supabase/types";
import type { GetMarketingSegmentsResult } from "@/hooks/use-marketing";
import { ListFilter, Pencil } from "lucide-react";
import { isArrayWithValues } from "@/lib/is-array-with-values";

const columnHelper = createColumnHelper<MarketingSegment>();

type SegmentsTableProps = {
  orgId: string;
  data: GetMarketingSegmentsResult;
  params: Record<string, string>;
  isLoading?: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
};

export function SegmentsTable({
  orgId,
  data,
  params,
  isLoading = false,
  searchValue,
  onSearchChange,
}: SegmentsTableProps) {
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
        cell: (ctx) => <span className="font-medium">{ctx.getValue()}</span>,
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (ctx) => (
          <span className="max-w-[200px] truncate text-muted-foreground text-sm block">
            {ctx.getValue() ?? "—"}
          </span>
        ),
      }),
      columnHelper.accessor("estimated_count", {
        header: "Est. size",
        cell: (ctx) => (
          <span className="tabular-nums text-muted-foreground text-sm">
            {ctx.getValue() != null ? String(ctx.getValue()) : "—"}
          </span>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: "Created",
        cell: (ctx) => (
          <DateDisplay value={ctx.getValue()} variant="timeAgo" layout="column" />
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${orgId}/marketing/segments/${row.original.id}`}>
              <Pencil className="size-3.5" />
              <span className="sr-only">Edit</span>
            </Link>
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
          {total === 0 ? "No segments" : `Showing ${from}–${to} of ${total} segments`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox
            value={searchValue}
            onChange={onSearchChange}
            placeholder="Search segments..."
            className="w-56 sm:w-64"
          />
          <Button size="sm" asChild>
            <Link href={`/${orgId}/marketing/segments/new`}>
              <ListFilter className="size-3.5" />
              New segment
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <TableLoadingSkeleton columnCount={5} rowCount={10} compact />
      ) : isArrayWithValues(data.items) ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-8 px-3 text-xs">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-1.5 px-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No segments"
          description="Create segments to target leads by status, source, or date."
          icon={ListFilter}
          action={
            <Button asChild>
              <Link href={`/${orgId}/marketing/segments/new`}>New segment</Link>
            </Button>
          }
        />
      )}

      {totalPages > 1 && (
        <Paginated
          pathname={`/${orgId}/marketing/segments`}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          defaultPageSize={10}
          params={params}
        />
      )}
    </div>
  );
}
