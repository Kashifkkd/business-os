"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useTask,
  useTaskComments,
  useTaskActivities,
  useTasks,
  useUpdateTask,
  useUpdateTaskById,
  useCreateTask,
  useCreateTaskComment,
  useSpaceStatuses,
  useSpaceLabels,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { AssigneeAvatars } from "@/components/assignee-avatars";
import { TASK_PRIORITY_OPTIONS } from "@/lib/task-priority";
import { ArrowLeft, Send, Trash2, Pencil, Plus, ListTodo } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import type { TaskPriority } from "@/lib/supabase/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteTask } from "@/hooks/use-tasks";
import { cn } from "@/lib/utils";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const taskId = params?.id as string;
  const base = `/${orgId}`;

  const { data: task, isLoading: taskLoading } = useTask(orgId, taskId);
  const { data: comments, isLoading: commentsLoading } = useTaskComments(orgId, taskId);
  const { data: activities } = useTaskActivities(orgId, taskId);
  const { data: statuses } = useSpaceStatuses(orgId, task?.space_id ?? undefined);
  const { data: labels: spaceLabels = [] } = useSpaceLabels(orgId, task?.space_id ?? undefined);
  const { data: subtasksResult } = useTasks(
    orgId,
    {
      space_id: task?.space_id ?? "",
      parent_id: taskId,
      page: 1,
      pageSize: 50,
    },
    { enabled: !!task?.space_id && !!taskId }
  );
  const { orgMembers = [] } = useOrganization(orgId, { enabled: !!orgId });
  const updateTask = useUpdateTask(orgId, taskId);
  const updateTaskById = useUpdateTaskById(orgId);
  const createTask = useCreateTask(orgId);
  const createComment = useCreateTaskComment(orgId, taskId);
  const deleteTask = useDeleteTask(orgId);

  const [commentBody, setCommentBody] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const subtasks = subtasksResult?.items ?? [];
  const doneStatusId = statuses?.find((s) => s.type === "done")?.id;

  const handleDelete = () => {
    deleteTask.mutate(taskId, {
      onSuccess: () => {
        setDeleteConfirmOpen(false);
        router.push(`${base}/tasks/list?space_id=${task?.space_id ?? ""}`);
      },
    });
  };

  const handleAddSubtask = () => {
    const title = newSubtaskTitle.trim();
    if (!title || !task?.space_id || !task?.list_id) return;
    createTask.mutate(
      {
        space_id: task.space_id,
        list_id: task.list_id,
        parent_id: taskId,
        title,
      },
      {
        onSuccess: () => setNewSubtaskTitle(""),
      }
    );
  };

  const membersForAvatars = orgMembers.map((m) => ({
    user_id: m.user_id,
    first_name: m.first_name,
    last_name: m.last_name,
    avatar_url: null,
  }));

  if (taskLoading || !task) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`${base}/tasks/list?space_id=${task.space_id}`}>
            <ArrowLeft className="mr-2 size-4" />
            Back to list
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`${base}/tasks/${taskId}/edit`}>
              <Pencil className="mr-2 size-4" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold break-words">{task.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {task.space_name} · {task.list_name}
            </p>
          </div>

          <div>
            <Label className="text-muted-foreground">Description</Label>
            <Textarea
              className="mt-1 min-h-[120px]"
              defaultValue={task.description ?? ""}
              placeholder="Add a description..."
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== (task.description ?? "")) {
                  updateTask.mutate({ description: v || null });
                }
              }}
            />
          </div>

          {/* Subtasks */}
          <div>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <ListTodo className="size-4" />
              Subtasks
              {subtasks.length > 0 && (
                <span className="text-muted-foreground text-sm font-normal">
                  {subtasks.filter((s) => s.status_type === "done").length}/{subtasks.length}
                </span>
              )}
            </h3>
            <ul className="space-y-2">
              {subtasks.map((st) => (
                <li
                  key={st.id}
                  className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
                >
                  <Checkbox
                    checked={st.status_type === "done"}
                    onCheckedChange={(checked) => {
                      if (!doneStatusId) return;
                      updateTaskById.mutate({
                        taskId: st.id,
                        data: { status_id: doneStatusId },
                      });
                    }}
                  />
                  <Link
                    href={`${base}/tasks/${st.id}`}
                    className={cn(
                      "flex-1 min-w-0 truncate hover:underline",
                      st.status_type === "done" && "text-muted-foreground line-through"
                    )}
                  >
                    {st.title}
                  </Link>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`${base}/tasks/${st.id}`} aria-label="Open subtask">
                      <Pencil className="size-3.5" />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add a subtask..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddSubtask}
                disabled={!newSubtaskTitle.trim() || createTask.isPending}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Comments */}
          <div>
            <h3 className="font-medium mb-2">Comments</h3>
            <div className="flex gap-2">
              <Textarea
                placeholder="Write a comment..."
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                className="min-h-[80px] flex-1"
              />
              <Button
                size="icon"
                className="shrink-0"
                onClick={() => {
                  if (!commentBody.trim()) return;
                  createComment.mutate(
                    { body: commentBody.trim() },
                    { onSuccess: () => setCommentBody("") }
                  );
                }}
                disabled={!commentBody.trim() || createComment.isPending}
              >
                <Send className="size-4" />
              </Button>
            </div>
            {commentsLoading ? (
              <Skeleton className="mt-3 h-20 w-full" />
            ) : (
              <ul className="mt-3 space-y-3">
                {(comments ?? []).map((c) => (
                  <li key={c.id} className="rounded-md border bg-muted/30 p-3 text-sm">
                    <p className="font-medium text-xs text-muted-foreground">
                      {c.author_name ?? "Someone"} · {format(new Date(c.created_at), "MMM d, yyyy HH:mm")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground text-xs">Status</Label>
            <Select
              value={task.status_id}
              onValueChange={(v) => updateTask.mutate({ status_id: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(statuses ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-muted-foreground text-xs">Assignees</Label>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <AssigneeAvatars
                assigneeIds={task.assignee_ids ?? []}
                members={membersForAvatars}
                max={5}
                size="default"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    {task.assignee_ids?.length ? "Change" : "Add"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {orgMembers.map((m) => {
                      const isAssigned = task.assignee_ids?.includes(m.user_id);
                      return (
                        <label
                          key={m.user_id}
                          className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted text-sm"
                        >
                          <Checkbox
                            checked={!!isAssigned}
                            onCheckedChange={(checked) => {
                              const next = checked
                                ? [...(task.assignee_ids ?? []), m.user_id]
                                : (task.assignee_ids ?? []).filter((id) => id !== m.user_id);
                              updateTask.mutate({ assignee_ids: next });
                            }}
                          />
                          {m.first_name || m.last_name
                            ? [m.first_name, m.last_name].filter(Boolean).join(" ")
                            : "Unknown"}
                        </label>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground text-xs">Priority</Label>
            <Select
              value={task.priority}
              onValueChange={(v) => updateTask.mutate({ priority: v as TaskPriority })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-muted-foreground text-xs">Due date</Label>
            <Input
              type="date"
              className="mt-1"
              value={task.due_date ?? ""}
              onChange={(e) => updateTask.mutate({ due_date: e.target.value || null })}
            />
          </div>

          <div>
            <Label className="text-muted-foreground text-xs">Start date</Label>
            <Input
              type="date"
              className="mt-1"
              value={task.start_date ?? ""}
              onChange={(e) => updateTask.mutate({ start_date: e.target.value || null })}
            />
          </div>

          <div>
            <Label className="text-muted-foreground text-xs">Labels</Label>
            <div className="mt-1 flex flex-wrap gap-1">
              {(task.labels ?? []).map((l) => (
                <Badge
                  key={l.id}
                  variant="secondary"
                  className="text-xs font-normal"
                  style={l.color ? { borderLeftColor: l.color, backgroundColor: `${l.color}20`, borderLeftWidth: 3, borderLeftStyle: "solid" } : undefined}
                >
                  {l.name}
                </Badge>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    {task.labels?.length ? "Edit" : "Add labels"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {spaceLabels.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-2">No labels in this project.</p>
                    ) : (
                      spaceLabels.map((l) => {
                        const isSelected = task.label_ids?.includes(l.id);
                        return (
                          <label
                            key={l.id}
                            className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted text-sm"
                          >
                            <Checkbox
                              checked={!!isSelected}
                              onCheckedChange={(checked) => {
                                const next = checked
                                  ? [...(task.label_ids ?? []), l.id]
                                  : (task.label_ids ?? []).filter((id) => id !== l.id);
                                updateTask.mutate({ label_ids: next });
                              }}
                            />
                            <Badge
                              variant="secondary"
                              className="text-xs font-normal"
                              style={l.color ? { backgroundColor: `${l.color}20` } : undefined}
                            >
                              {l.name}
                            </Badge>
                          </label>
                        );
                      })
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Activity</h3>
            <ul className="space-y-2 text-sm">
              {(activities ?? []).slice(0, 15).map((a) => (
                <li key={a.id} className="flex gap-2">
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {format(new Date(a.created_at), "MMM d, HH:mm")}
                  </span>
                  <span>
                    {a.actor_name ?? "Someone"} {a.action_type.replace(/_/g, " ")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task &quot;{task.title}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}