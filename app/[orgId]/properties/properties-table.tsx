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
import { SearchBox } from "@/components/search-box";
import { EmptyState } from "@/components/empty-state";
import { TableLoadingSkeleton } from "@/components/table-loading-skeleton";
import { DateDisplay } from "@/components/date-display";
import { Paginated } from "@/components/paginated";
import type { Property } from "@/lib/supabase/types";
import type { GetPropertiesResult } from "@/lib/supabase/queries";
import { Home, Plus, Pencil, Trash2, Filter } from "lucide-react";
import { isArrayWithValues } from "@/lib/is-array-with-values";

const columnHelper = createColumnHelper<Property>();

type PropertiesTableProps = {
  orgId: string;
  data: GetPropertiesResult;
  searchParams: { page?: string; pageSize?: string; search?: string };
  isLoading?: boolean;
  isRefetching?: boolean;
  onDelete?: (property: Property) => void;
  searchInput?: string;
  onSearchInputChange?: (value: string) => void;
};

export function PropertiesTable({
  orgId,
  data,
  searchParams,
  isLoading = false,
  isRefetching = false,
  onDelete,
  searchInput = "",
  onSearchInputChange,
}: PropertiesTableProps) {
  const pathname = usePathname();
  const page = data.page;
  const pageSize = data.pageSize;
  const total = data.total;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const columns = useMemo(
    () => [
      columnHelper.accessor("address", {
        header: "Address",
        cell: (ctx) => (
          <span className="font-medium">{ctx.getValue()}</span>
        ),
      }),
      columnHelper.accessor("type", {
        header: "Type",
        cell: (ctx) => (
          <span className="text-muted-foreground">
            {ctx.getValue() ?? "—"}
          </span>
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
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" asChild>
              <Link href={`/${orgId}/properties/${row.original.id}`}>
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
            ? "No properties"
            : `Showing ${from}–${to} of ${total} properties`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {onSearchInputChange && (
            <SearchBox
              value={searchInput}
              onChange={onSearchInputChange}
              placeholder="Search..."
              className="w-56 sm:w-64"
            />
          )}
          <Button variant="outline" size="sm">
            <Filter className="size-3.5" />
            Filters
          </Button>
          <Button size="sm" asChild>
            <Link href={`/${orgId}/properties/new`}>
              <Plus className="size-3.5" />
              Create
            </Link>
          </Button>
        </div>
      </div>

      {isLoading || isRefetching ? (
        <TableLoadingSkeleton columnCount={4} rowCount={10} compact />
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
          title={searchParams.search ? "No results for your search" : "No properties"}
          description={
            searchParams.search
              ? "Try a different search term or clear the search."
              : "Add your first property to get started."
          }
          icon={Home}
          action={
            searchParams.search ? undefined : (
              <Button size="sm" asChild>
                <Link href={`/${orgId}/properties/new`}>
                  <Plus className="size-3.5" />
                  Create property
                </Link>
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
