"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/empty-state";
import { TableLoadingSkeleton } from "@/components/table-loading-skeleton";
import { Paginated } from "@/components/paginated";
import { SearchBox } from "@/components/search-box";
import { SourceChip } from "@/components/source-chip";
import type { Lead } from "@/lib/supabase/types";
import type { GetLeadsResult } from "@/hooks/use-leads";
import { UserPlus, Filter, Pencil, Trash2, X } from "lucide-react";
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
  params: {
    page?: string;
    pageSize?: string;
    search?: string;
    status?: string;
    source?: string;
    created_after?: string;
    created_before?: string;
    sortBy?: string;
    order?: string;
  };
  isLoading?: boolean;
  onDelete?: (lead: Lead) => void;
  sortBy?: string;
  order?: string;
  onSortChange?: (sortBy: string, order: "asc" | "desc") => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  bulkStatusOptions?: { value: string; label: string }[];
  onBulkStatusChange?: (status: string) => void;
  onBulkDeleteClick?: () => void;
  bulkUpdatePending?: boolean;
  bulkDeletePending?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onFilterClick?: () => void;
  /** Map of source name -> hex color for SourceChip display. */
  sourceColors?: Record<string, string>;
};

function SortableHeader({
  label,
  columnKey,
  currentSortBy,
  currentOrder,
  onSortChange,
}: {
  label: string;
  columnKey: string;
  currentSortBy?: string;
  currentOrder?: string;
  onSortChange?: (sortBy: string, order: "asc" | "desc") => void;
}) {
  const isActive = currentSortBy === columnKey;
  const nextOrder = isActive && currentOrder === "desc" ? "asc" : "desc";
  return (
    <button
      type="button"
      className="flex items-center gap-1 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
      onClick={() => onSortChange?.(columnKey, nextOrder)}
    >
      {label}
      {isActive && (
        <span className="text-muted-foreground text-[10px]">{currentOrder === "asc" ? "↑" : "↓"}</span>
      )}
    </button>
  );
}

export function LeadsTable({
  orgId,
  data,
  params,
  isLoading = false,
  onDelete,
  sortBy = "created_at",
  order = "desc",
  onSortChange,
  selectedIds = new Set(),
  onSelectionChange,
  bulkStatusOptions = [],
  onBulkStatusChange,
  onBulkDeleteClick,
  bulkUpdatePending = false,
  bulkDeletePending = false,
  searchValue = "",
  onSearchChange,
  onFilterClick,
  sourceColors,
}: LeadsTableProps) {
  const pathname = usePathname();
  const { items, page, pageSize, total } = data;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const toggleSelection = useCallback(
    (id: string) => {
      if (!onSelectionChange) return;
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onSelectionChange(next);
    },
    [onSelectionChange, selectedIds]
  );

  const toggleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (selectedIds.size === items.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(items.map((l) => l.id)));
    }
  }, [onSelectionChange, selectedIds.size, items]);

  const columns = useMemo(
    () => [
      ...(onSelectionChange
        ? [
          columnHelper.display({
            id: "select",
            header: () => (
              <Checkbox
                checked={items.length > 0 && selectedIds.size === items.length}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all"
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                checked={selectedIds.has(row.original.id)}
                onCheckedChange={() => toggleSelection(row.original.id)}
                aria-label={`Select ${row.original.name}`}
              />
            ),
          }),
        ]
        : []),
      columnHelper.accessor("name", {
        header: () => (
          <SortableHeader
            label="Name"
            columnKey="name"
            currentSortBy={sortBy}
            currentOrder={order}
            onSortChange={onSortChange}
          />
        ),
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
        header: () => (
          <SortableHeader
            label="Company"
            columnKey="company"
            currentSortBy={sortBy}
            currentOrder={order}
            onSortChange={onSortChange}
          />
        ),
        cell: (ctx) => (
          <span className="text-muted-foreground">{ctx.getValue() ?? "—"}</span>
        ),
      }),
      columnHelper.accessor("source", {
        header: "Source",
        cell: (ctx) => (
          <SourceChip
            source={ctx.getValue() ?? undefined}
            color={sourceColors?.[String(ctx.getValue() ?? "")]}
          />
        ),
      }),
      columnHelper.accessor("status", {
        header: () => (
          <SortableHeader
            label="Status"
            columnKey="status"
            currentSortBy={sortBy}
            currentOrder={order}
            onSortChange={onSortChange}
          />
        ),
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
      columnHelper.accessor("created_at", {
        header: () => (
          <SortableHeader
            label="Created"
            columnKey="created_at"
            currentSortBy={sortBy}
            currentOrder={order}
            onSortChange={onSortChange}
          />
        ),
        cell: (ctx) => (
          <span className="text-muted-foreground text-xs">
            {ctx.getValue()
              ? new Date(ctx.getValue() as string).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
              : "—"}
          </span>
        ),
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
    [
      orgId,
      onDelete,
      sortBy,
      order,
      onSortChange,
      selectedIds,
      onSelectionChange,
      items.length,
    ]
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const searchParamsForPaginated = {
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.source && { source: params.source }),
    ...(params.created_after && { created_after: params.created_after }),
    ...(params.created_before && { created_before: params.created_before }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.order && { order: params.order }),
  };


  return (
    <div className="flex flex-col gap-4">


      {/* Bulk actions toolbar – sticky when any row is selected */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-md border bg-background px-3 py-2 shadow-sm">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          {bulkStatusOptions.length > 0 && onBulkStatusChange && (
            <Select
              onValueChange={(v) => {
                if (v) onBulkStatusChange(v);
              }}
              disabled={bulkUpdatePending}
            >
              <SelectTrigger className="h-8 w-36">
                <SelectValue placeholder="Set status" />
              </SelectTrigger>
              <SelectContent>
                {bulkStatusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {onBulkDeleteClick && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={onBulkDeleteClick}
              disabled={bulkDeletePending}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          )}
          {onSelectionChange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectionChange(new Set())}
            >
              <X className="size-3.5" />
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Top bar: count (left) | Search, Filters, Create (right) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {total === 0
            ? "No leads"
            : `Showing ${from}–${to} of ${total} leads`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {onSearchChange && (
            <SearchBox
              value={searchValue}
              onChange={onSearchChange}
              placeholder="Search name, email, company..."
              className="w-56 sm:w-64"
            />
          )}
          {onFilterClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFilterClick}
              aria-label="Open filters"
            >
              <Filter className="size-3.5" />
              Filters
            </Button>
          )}
          <Button size="sm" asChild>
            <Link href={`/${orgId}/leads/new`}>
              <UserPlus className="size-3.5" />
              New lead
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
          title={
            params.search || params.status || params.source || params.created_after || params.created_before
              ? "No results for your filters"
              : "No leads"
          }
          description={
            params.search || params.status || params.source || params.created_after || params.created_before
              ? "Try adjusting filters or clear them."
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
            )
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
