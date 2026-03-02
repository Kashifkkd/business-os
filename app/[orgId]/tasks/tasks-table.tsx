"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type RowSelectionState,
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
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/empty-state";
import { TableLoadingSkeleton } from "@/components/table-loading-skeleton";
import { Paginated } from "@/components/paginated";
import { AssigneeAvatars } from "@/components/assignee-avatars";
import { getPriorityLabel, getPriorityClassName } from "@/lib/task-priority";
import type { Task } from "@/lib/supabase/types";
import type { GetTasksResult } from "@/hooks/use-tasks";
import { ListTodo, Pencil, Trash2, Filter, Plus, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type MemberInfo = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url?: string | null;
};

type TasksTableProps = {
  orgId: string;
  basePath: string;
  spaceId?: string;
  data: GetTasksResult;
  isLoading?: boolean;
  page: number;
  pageSize: number;
  searchParams: Record<string, string>;
  members: MemberInfo[];
  sortBy?: string;
  order?: "asc" | "desc";
  onSortChange?: (sortBy: string, order: "asc" | "desc") => void;
  onDelete?: (task: Task) => void;
  onBulkDelete?: (taskIds: string[]) => void;
};

const columnHelper = createColumnHelper<Task>();

export function TasksTable({
  orgId,
  basePath,
  spaceId,
  data,
  isLoading,
  page,
  pageSize,
  searchParams,
  members,
  sortBy = "updated_at",
  order = "desc",
  onSortChange,
  onDelete,
  onBulkDelete,
}: TasksTableProps) {
  const pathname = usePathname();
  const { items, total } = data;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all"
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Select row"
            className="translate-y-0.5"
          />
        ),
      }),
      columnHelper.accessor("title", {
        header: () =>
          onSortChange ? (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 font-medium"
              onClick={() => onSortChange("title", sortBy === "title" && order === "asc" ? "desc" : "asc")}
            >
              Title
              {sortBy === "title" ? order === "asc" ? <ArrowUp className="ml-1 size-3.5" /> : <ArrowDown className="ml-1 size-3.5" /> : <ArrowUpDown className="ml-1 size-3.5 opacity-50" />}
            </Button>
          ) : (
            "Title"
          ),
        cell: (ctx) => {
          const task = ctx.row.original;
          return (
            <div className="min-w-0">
              <Link
                href={`${basePath}/tasks/${task.id}`}
                className="font-medium hover:underline truncate block"
              >
                {task.title}
              </Link>
              {task.subtask_count ? (
                <span className="text-muted-foreground text-xs">
                  {task.subtask_count} subtask{task.subtask_count !== 1 ? "s" : ""}
                </span>
              ) : null}
            </div>
          );
        },
      }),
      columnHelper.accessor("status_name", {
        header: "Status",
        cell: (ctx) => {
          const task = ctx.row.original;
          const color = (task as Task & { status_color?: string | null }).status_color;
          return (
            <Badge
              variant="secondary"
              className={cn(
                "font-normal",
                color && "border-l-4 border-l-current"
              )}
              style={color ? { borderLeftColor: color, backgroundColor: `${color}20` } : undefined}
            >
              {task.status_name ?? "—"}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("list_name", {
        header: "List",
        cell: (ctx) => (
          <span className="text-muted-foreground text-sm">{ctx.getValue() ?? "—"}</span>
        ),
      }),
      columnHelper.display({
        id: "assignees",
        header: "Assignees",
        cell: ({ row }) => (
          <AssigneeAvatars
            assigneeIds={row.original.assignee_ids ?? []}
            members={members}
            max={3}
            size="sm"
          />
        ),
      }),
      columnHelper.accessor("priority", {
        header: () =>
          onSortChange ? (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 font-medium"
              onClick={() => onSortChange("priority", sortBy === "priority" && order === "asc" ? "desc" : "asc")}
            >
              Priority
              {sortBy === "priority" ? order === "asc" ? <ArrowUp className="ml-1 size-3.5" /> : <ArrowDown className="ml-1 size-3.5" /> : <ArrowUpDown className="ml-1 size-3.5 opacity-50" />}
            </Button>
          ) : (
            "Priority"
          ),
        cell: (ctx) => (
          <Badge variant="secondary" className={cn("font-normal text-xs", getPriorityClassName(ctx.getValue()))}>
            {getPriorityLabel(ctx.getValue())}
          </Badge>
        ),
      }),
      columnHelper.accessor("due_date", {
        header: () =>
          onSortChange ? (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 font-medium"
              onClick={() => onSortChange("due_date", sortBy === "due_date" && order === "asc" ? "desc" : "asc")}
            >
              Due date
              {sortBy === "due_date" ? order === "asc" ? <ArrowUp className="ml-1 size-3.5" /> : <ArrowDown className="ml-1 size-3.5" /> : <ArrowUpDown className="ml-1 size-3.5 opacity-50" />}
            </Button>
          ) : (
            "Due date"
          ),
        cell: (ctx) => (
          <span className="text-muted-foreground text-sm tabular-nums">
            {ctx.getValue() ? format(new Date(ctx.getValue()!), "MMM d, yyyy") : "—"}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`${basePath}/tasks/${row.original.id}`} aria-label="Edit">
                <Pencil className="size-4" />
              </Link>
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(row.original)}
                aria-label="Delete"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        ),
      }),
    ],
    [basePath, members, sortBy, order, onSortChange, onDelete]
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const selectedIds = selectedRows.map((r) => r.original.id);

  const paginatedParams: Record<string, string> = useMemo(() => {
    const p: Record<string, string> = { ...searchParams };
    if (searchParams.space_id) p.space_id = searchParams.space_id;
    if (searchParams.list_id) p.list_id = searchParams.list_id;
    if (searchParams.search) p.search = searchParams.search;
    if (searchParams.assignee_id) p.assignee_id = searchParams.assignee_id;
    if (sortBy && sortBy !== "updated_at") p.sortBy = sortBy;
    if (order && order !== "desc") p.order = order;
    return p;
  }, [searchParams, sortBy, order]);

  if (isLoading) {
    return <TableLoadingSkeleton columnCount={8} rowCount={10} />;
  }

  if (!items.length) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState
          icon={ListTodo}
          title="No tasks"
          description="Create a task or change filters."
          action={
            <Button asChild>
              <Link href={`${basePath}/tasks/new?space_id=${spaceId ?? ""}`}>
                New task
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {selectedCount > 0 ? (
          <p className="text-muted-foreground text-sm">
            {selectedCount} selected
            <Button
              variant="link"
              size="sm"
              className="ml-2 h-auto p-0 text-destructive"
              onClick={() => {
                table.resetRowSelection();
                onBulkDelete?.(selectedIds);
              }}
            >
              Delete selected
            </Button>
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Showing {from}–{to} of {total} task{total !== 1 ? "s" : ""}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`${basePath}/tasks/new?space_id=${spaceId ?? ""}`}>
              <Plus className="size-3.5" />
              New task
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-8 px-3 text-xs">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="[&_td]:py-2 [&_td]:px-3 [&_td]:text-sm">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Paginated
        pathname={pathname}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        defaultPageSize={20}
        params={paginatedParams}
      />
    </div>
  );
}
