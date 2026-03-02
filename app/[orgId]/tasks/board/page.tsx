"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useSpaces,
  useSpaceStatuses,
  useTasks,
  useUpdateTaskById,
} from "@/hooks/use-tasks";
import { useOrganization } from "@/hooks/use-organization";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AssigneeAvatars } from "@/components/assignee-avatars";
import { getPriorityClassName, getPriorityLabel } from "@/lib/task-priority";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import type { Task, TaskStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function TasksBoardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const base = `/${orgId}`;
  const spaceId = searchParams.get("space_id") ?? "";

  const { data: spaces, isLoading: spacesLoading } = useSpaces(orgId);
  const { data: statuses, isLoading: statusesLoading } = useSpaceStatuses(orgId, spaceId || undefined);
  const updateTaskById = useUpdateTaskById(orgId);

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverStatusId, setDragOverStatusId] = useState<string | null>(null);

  const tasksByStatus: Record<string, Task[]> = {};
  if (statuses) {
    for (const s of statuses) {
      tasksByStatus[s.id] = [];
    }
  }

  const { data: allTasks } = useTasks(
    orgId,
    {
      space_id: spaceId,
      page: 1,
      pageSize: 500,
      sortBy: "sort_order",
      order: "asc",
      enrich: "assignees,labels",
    },
    { enabled: !!spaceId && !!statuses?.length }
  );
  const { orgMembers = [] } = useOrganization(orgId, { enabled: !!orgId });
  const membersForAvatars = orgMembers.map((m) => ({
    user_id: m.user_id,
    first_name: m.first_name,
    last_name: m.last_name,
    avatar_url: null,
  }));

  if (allTasks?.items) {
    for (const t of allTasks.items) {
      const list = tasksByStatus[t.status_id];
      if (list) list.push(t);
      else tasksByStatus[t.status_id] = [t];
    }
  }

  const setSpace = useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (id) next.set("space_id", id);
      else next.delete("space_id");
      router.push(`${base}/tasks/board?${next.toString()}`);
    },
    [base, router, searchParams]
  );

  const effectiveSpaceId = spaceId || spaces?.[0]?.id;
  if (effectiveSpaceId && !spaceId) {
    setSpace(effectiveSpaceId);
    return null;
  }

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverStatusId(null);
  };

  const handleDragOver = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    setDragOverStatusId(statusId);
  };

  const handleDrop = (e: React.DragEvent, toStatusId: string) => {
    e.preventDefault();
    setDragOverStatusId(null);
    if (!draggedTask || draggedTask.status_id === toStatusId) {
      setDraggedTask(null);
      return;
    }
    updateTaskById.mutate(
      { taskId: draggedTask.id, data: { status_id: toStatusId } },
      {
        onSuccess: () => {
          setDraggedTask(null);
        },
      }
    );
  };

  if (spacesLoading || !spaces?.length) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Select value={spaceId} onValueChange={setSpace}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            {spaces.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild>
          <Link href={`${base}/tasks/new?space_id=${spaceId}`}>
            <Plus className="mr-2 size-4" />
            New task
          </Link>
        </Button>
      </div>

      {statusesLoading || !statuses?.length ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statuses.map((status) => (
            <KanbanColumn
              key={status.id}
              status={status}
              tasks={tasksByStatus[status.id] ?? []}
              basePath={base}
              members={membersForAvatars}
              isDragOver={dragOverStatusId === status.id}
              onDragOver={(e) => handleDragOver(e, status.id)}
              onDrop={(e) => handleDrop(e, status.id)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              draggedTask={draggedTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type MemberInfo = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url?: string | null;
};

function KanbanColumn({
  status,
  tasks,
  basePath,
  members,
  isDragOver,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  draggedTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  basePath: string;
  members: MemberInfo[];
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragStart: (task: Task) => void;
  onDragEnd: () => void;
  draggedTask: Task | null;
}) {
  const statusColor = status.color;
  return (
    <div
      className={cn(
        "flex min-w-[280px] flex-1 flex-col rounded-lg border bg-muted/30 p-3 transition-colors",
        isDragOver && "ring-2 ring-primary"
      )}
      style={
        statusColor
          ? { borderLeftWidth: 4, borderLeftColor: statusColor, borderLeftStyle: "solid" }
          : undefined
      }
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={() => {}}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium">{status.name}</h3>
        <span className="text-muted-foreground text-sm">{tasks.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            basePath={basePath}
            members={members}
            isDragging={draggedTask?.id === task.id}
            onDragStart={() => onDragStart(task)}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
}

function KanbanCard({
  task,
  basePath,
  members,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  task: Task;
  basePath: string;
  members: MemberInfo[];
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <Link
      href={`${basePath}/tasks/${task.id}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "rounded-md border bg-background p-3 shadow-sm transition-shadow hover:shadow flex flex-col gap-2",
        isDragging && "opacity-50"
      )}
    >
      <p className="font-medium text-sm line-clamp-2">{task.title}</p>
      {(task.priority && task.priority !== "none") && (
        <Badge variant="secondary" className={cn("w-fit text-[10px] font-normal", getPriorityClassName(task.priority))}>
          {getPriorityLabel(task.priority)}
        </Badge>
      )}
      {(task.labels?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels?.slice(0, 3).map((l) => (
            <span
              key={l.id}
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={l.color ? { backgroundColor: `${l.color}30`, color: l.color } : undefined}
            >
              {l.name}
            </span>
          ))}
          {(task.labels?.length ?? 0) > 3 && (
            <span className="text-muted-foreground text-[10px]">+{(task.labels?.length ?? 0) - 3}</span>
          )}
        </div>
      )}
      <div className="flex items-center justify-between gap-2 mt-auto">
        {task.due_date && (
          <p className="text-muted-foreground text-xs">
            Due {format(new Date(task.due_date), "MMM d")}
          </p>
        )}
        <AssigneeAvatars
          assigneeIds={task.assignee_ids ?? []}
          members={members}
          max={2}
          size="sm"
        />
      </div>
    </Link>
  );
}
