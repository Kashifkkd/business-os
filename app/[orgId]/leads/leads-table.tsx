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
import { Paginated } from "@/components/paginated";
import type { Lead } from "@/lib/supabase/types";
import type { GetLeadsResult } from "@/hooks/use-leads";
import { UserPlus, Filter, Pencil, Trash2 } from "lucide-react";
import { isArrayWithValues } from "@/lib/is-array-with-values";
import { cn } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  new: "secondary",
  contacted: "default",
  qualified: "default",
  proposal: "outline",
  won: "default",
  lost: "destructive",
};

const columnHelper = createColumnHelper<Lead>();

type LeadsTableProps = {
  orgId: string;
  data: GetLeadsResult;
  params: { page?: string; pageSize?: string; search?: string; status?: string };
  isLoading?: boolean;
  onDelete?: (lead: Lead) => void;
};

export function LeadsTable({
  orgId,
  data,
  params,
  isLoading = false,
  onDelete,
}: LeadsTableProps) {
  const pathname = usePathname();
  const { items, page, pageSize, total } = data;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (ctx) => (
          <Link
            href={`/${orgId}/leads/${ctx.row.original.id}`}
            className="font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
          >
            {ctx.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: (ctx) => (
          <span className="text-muted-foreground">{ctx.getValue() ?? "—"}</span>
        ),
      }),
      columnHelper.accessor("company", {
        header: "Company",
        cell: (ctx) => (
          <span className="text-muted-foreground">{ctx.getValue() ?? "—"}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (ctx) => {
          const status = ctx.getValue();
          return (
            <Badge
              variant={STATUS_VARIANTS[status] ?? "secondary"}
              className={cn("text-[10px] font-normal capitalize", status === "lost" && "opacity-90")}
            >
              {status}
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" asChild>
              <Link href={`/${orgId}/leads/${row.original.id}`}>
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
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const searchParamsForPaginated = {
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar: count | Filters + Create */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {total === 0
            ? "No leads"
            : `Showing ${from}–${to} of ${total} leads`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="size-3.5" />
            Filters
          </Button>
          <Button size="sm" asChild>
            <Link href={`/${orgId}/leads/new`}>
              <UserPlus className="size-3.5" />
              Create
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <TableLoadingSkeleton columnCount={5} rowCount={10} compact />
      ) : isArrayWithValues(items) ? (
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
          title={params.search ? "No results for your search" : "No leads"}
          description={
            params.search
              ? "Try a different search term or clear the search."
              : "Add your first lead to get started."
          }
          icon={UserPlus}
          action={
            params.search ? undefined : (
              <Button size="sm" asChild>
                <Link href={`/${orgId}/leads/new`}>
                  <UserPlus className="size-3.5" />
                  Create lead
                </Link>
              </Button>
            }
          }
        />
      )}

      {totalPages > 1 && (
        <Paginated
          pathname={pathname}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          defaultPageSize={10}
          params={searchParamsForPaginated}
        />
      )}
    </div>
  );
}
