"use client";

import Link from "next/link";
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
import type { Task } from "@/lib/supabase/types";
import type { GetTasksResult } from "@/hooks/use-tasks";
import { ListTodo, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "None",
};

type TasksTableProps = {
  orgId: string;
  basePath: string;
  spaceId?: string;
  data: GetTasksResult;
  isLoading?: boolean;
  page: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
  onDelete?: (task: Task) => void;
};

export function TasksTable({
  orgId,
  basePath,
  spaceId,
  data,
  isLoading,
  page,
  pageSize,
  onPageChange,
  onDelete,
}: TasksTableProps) {
  const { items, total } = data;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (isLoading) {
    return <TableLoadingSkeleton rows={10} columns={5} />;
  }

  if (!items.length) {
    return (
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
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>List</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Link
                    href={`${basePath}/tasks/${task.id}`}
                    className="font-medium hover:underline"
                  >
                    {task.title}
                  </Link>
                  {task.subtask_count ? (
                    <span className="ml-2 text-muted-foreground text-xs">
                      ({task.subtask_count} subtasks)
                    </span>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{task.status_name ?? "—"}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {task.list_name ?? "—"}
                </TableCell>
                <TableCell>{PRIORITY_LABELS[task.priority] ?? task.priority}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`${basePath}/tasks/${task.id}`} aria-label="Edit">
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(task)}
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} of {totalPages} ({total} tasks)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
