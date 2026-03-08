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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { EmailDisplay } from "@/components/email-display";
import { PhoneDisplay } from "@/components/phone-display";
import { DateDisplay } from "@/components/date-display";
import { DisplayName } from "@/components/display-name";
import { LeadAssigneesCell } from "@/components/lead-assignees-cell";
import { StageChip } from "@/components/stage-chip";
import { getLeadDisplayName } from "@/lib/display-name";
import type { Lead } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import type { GetLeadsResult } from "@/hooks/use-leads";
import { UserPlus, Filter, Pencil, Trash2, X, RefreshCw, Loader2, MoreVertical, Eye, Users, ArrowRightLeft } from "lucide-react";
import { isArrayWithValues } from "@/lib/is-array-with-values";

const columnHelper = createColumnHelper<Lead>();

/**
 * Label for "Created by" display: "You" when current user is creator, "Owner" when no creator, else undefined (show real name).
 */
function getCreatedByDisplayLabel(
  createdBy: string | null | undefined,
  createdByName: string | null | undefined,
  currentUserId: string | null | undefined
): string | undefined {
  if (currentUserId && createdBy === currentUserId) return "You";
  if (!createdBy || !createdByName?.trim()) return "Owner";
  return undefined;
}

type LeadsTableProps = {
  orgId: string;
  data: GetLeadsResult;
  params: {
    page?: string;
    pageSize?: string;
    search?: string;
    stage?: string;
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
  bulkStageOptions?: { id: string; name: string }[];
  onBulkStageChange?: (stage_id: string) => void;
  onBulkDeleteClick?: () => void;
  bulkUpdatePending?: boolean;
  bulkDeletePending?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onFilterClick?: () => void;
  /** Map of source name -> hex color for SourceChip display. */
  sourceColors?: Record<string, string>;
  /** Map of stage id -> hex color for stage chip display. */
  stageColors?: Record<string, string>;
  /** Locale and time format for Created at column */
  locale?: string;
  timeFormat?: "12h" | "24h";
  onRefresh?: () => void;
  isRefetching?: boolean;
  /** When set, assignees with this user_id are shown as "You" in Assigned to. */
  currentUserId?: string | null;
  /** When set and lead has no assignees, assign icon is shown; called on assign click. */
  onAssignClick?: (lead: Lead) => void;
  /** Called from Actions → Edit team members. */
  onEditAssignees?: (lead: Lead) => void;
  /** Called from Actions → Change stage. */
  onChangeStage?: (lead: Lead) => void;
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
  bulkStageOptions = [],
  onBulkStageChange,
  onBulkDeleteClick,
  bulkUpdatePending = false,
  bulkDeletePending = false,
  searchValue = "",
  onSearchChange,
  onFilterClick,
  sourceColors,
  stageColors,
  locale,
  timeFormat,
  onRefresh,
  isRefetching = false,
  currentUserId = null,
  onAssignClick,
  onEditAssignees,
  onChangeStage,
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
                aria-label={`Select ${getLeadDisplayName(row.original)}`}
              />
            ),
          }),
        ]
        : []),
      columnHelper.display({
        id: "name",
        header: () => (
          <SortableHeader
            label="Name"
            columnKey="last_name"
            currentSortBy={sortBy}
            currentOrder={order}
            onSortChange={onSortChange}
          />
        ),
        cell: (ctx) => {
          const lead = ctx.row.original;
          const displayName = getLeadDisplayName(lead);
          return (
            <div className="flex flex-col gap-0.5">
              <Link
                href={`/${orgId}/leads/${lead.id}`}
                className="font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded w-fit"
              >
                {displayName}
              </Link>
              {lead.company_name?.trim() && (
                <span className="text-muted-foreground text-xs">{lead.company_name.trim()}</span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: (ctx) => <EmailDisplay email={ctx.getValue()} />,
      }),
      columnHelper.accessor("phone", {
        header: "Mobile",
        cell: (ctx) => <PhoneDisplay phone={ctx.getValue()} />,
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
      columnHelper.display({
        id: "stage",
        header: () => (
          <SortableHeader
            label="Stage"
            columnKey="stage_id"
            currentSortBy={sortBy}
            currentOrder={order}
            onSortChange={onSortChange}
          />
        ),
        cell: ({ row }) => (
          <StageChip
            name={row.original.stage_name ?? row.original.stage_id ?? undefined}
            color={row.original.stage_id ? stageColors?.[row.original.stage_id] : undefined}
          />
        ),
      }),
      columnHelper.display({
        id: "assignees",
        header: "Assigned to",
        cell: ({ row }) => {
          const lead = row.original;
          const assignees = lead.assignees ?? [];
          const canAssign = assignees.length === 0 && onAssignClick;
          return (
            <div className="flex items-center gap-1.5 min-w-0">
              {assignees.length > 0 ? (
                <LeadAssigneesCell
                  assignees={assignees}
                  currentUserId={currentUserId}
                />
              ) : (
                <>
                  <span className="text-muted-foreground text-xs">—</span>
                  {canAssign && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssignClick(lead);
                      }}
                      aria-label="Assign team members"
                    >
                      <UserPlus className="size-3.5" />
                    </Button>
                  )}
                </>
              )}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "created_by",
        header: "Created by",
        cell: ({ row }) => (
          <DisplayName
            name={row.original.created_by_name?.trim() || "—"}
            avatarUrl={row.original.created_by_avatar_url ?? undefined}
            label={getCreatedByDisplayLabel(
              row.original.created_by,
              row.original.created_by_name,
              currentUserId
            )}
            size="sm"
          />
        ),
      }),
      columnHelper.accessor("created_at", {
        header: () => (
          <SortableHeader
            label="Created at"
            columnKey="created_at"
            currentSortBy={sortBy}
            currentOrder={order}
            onSortChange={onSortChange}
          />
        ),
        cell: (ctx) => (
          <DateDisplay
            value={ctx.getValue() as string}
            variant="datetimeWithAgo"
            layout="column"
            timeAgoWithinDays={7}
            locale={locale}
            timeFormat={timeFormat}
          />
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: () => "Actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="size-8 data-[state=open]:bg-muted"
                aria-label="Actions"
              >
                <MoreVertical className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px]">
              <DropdownMenuItem asChild>
                <Link href={`/${orgId}/leads/${row.original.id}`}>
                  <Eye className="size-3.5" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${orgId}/leads/${row.original.id}/edit`}>
                  <Pencil className="size-3.5" />
                  Edit
                </Link>
              </DropdownMenuItem>
              {onEditAssignees && (
                <DropdownMenuItem onClick={() => onEditAssignees(row.original)}>
                  <Users className="size-3.5" />
                  Edit team members
                </DropdownMenuItem>
              )}
              {onChangeStage && (
                <DropdownMenuItem onClick={() => onChangeStage(row.original)}>
                  <ArrowRightLeft className="size-3.5" />
                  Change stage
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(row.original)}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
      locale,
      timeFormat,
      sourceColors,
      stageColors,
      currentUserId,
      onAssignClick,
      onEditAssignees,
      onChangeStage,
      toggleSelectAll,
      toggleSelection,
    ]
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const searchParamsForPaginated = {
    ...(params.search && { search: params.search }),
    ...(params.stage && { stage: params.stage }),
    ...(params.source && { source: params.source }),
    ...(params.created_after && { created_after: params.created_after }),
    ...(params.created_before && { created_before: params.created_before }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.order && { order: params.order }),
  };


  return (
    <div className="flex h-full flex-1 flex-col gap-3 overflow-auto">
      {/* Bulk actions toolbar – sticky when any row is selected */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center px-4  gap-2 rounded-md border bg-background px-3 py-2 shadow-sm">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          {bulkStageOptions.length > 0 && onBulkStageChange && (
            <Select
              onValueChange={(v) => {
                if (v) onBulkStageChange(v);
              }}
              disabled={bulkUpdatePending}
            >
              <SelectTrigger className="h-8 w-36">
                <SelectValue placeholder="Set stage" />
              </SelectTrigger>
              <SelectContent>
                {bulkStageOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.name}
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
      <div className="flex flex-wrap px-4  items-center justify-between gap-3">
        <p className="text text-sm">
          {total === 0
            ? "No leads"
            : `Showing ${from}–${to} of ${total} leads`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRefresh()}
              disabled={isRefetching}
              aria-label="Refresh"
            >
              {isRefetching ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
            </Button>
          )}
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


      <div className="flex flex-col flex-1 h-full overflow-auto px-4">
        {isLoading ? (
          <TableLoadingSkeleton columnCount={5} rowCount={10} compact />
        ) : isArrayWithValues(items) ? (

          <div className="flex max-h-fit flex-1 flex-col overflow-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={cn(
                          "h-8 px-3 text-xs",
                          header.column.id === "actions" &&
                            "sticky right-0 z-10 bg-muted/60 backdrop-blur shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.05)]"
                        )}
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
                      <TableCell
                        key={cell.id}
                        className={cn(
                          cell.column.id === "actions" &&
                            "sticky right-0 z-10 bg-background shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.05)]"
                        )}
                      >
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
              params.search || params.stage || params.source || params.created_after || params.created_before
                ? "No results for your filters"
                : "No leads"
            }
            description={
              params.search || params.stage || params.source || params.created_after || params.created_before
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
      </div>

      <div className="border-t bg-background shrink-0">
        <Paginated
          pathname={pathname}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          defaultPageSize={10}
          params={searchParamsForPaginated}
          pageSizeOptions={[10, 25, 50, 100]}
          className="sticky bottom-0 z-20"
        />
      </div>
    </div>
  );
}
