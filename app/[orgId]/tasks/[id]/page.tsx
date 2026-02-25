"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useTask,
  useTaskComments,
  useTaskActivities,
  useUpdateTask,
  useCreateTaskComment,
} from "@/hooks/use-tasks";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import type { TaskPriority } from "@/lib/supabase/types";
import { useSpaceStatuses } from "@/hooks/use-tasks";
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

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

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
  const updateTask = useUpdateTask(orgId, taskId);
  const createComment = useCreateTaskComment(orgId, taskId);
  const deleteTask = useDeleteTask(orgId);

  const [commentBody, setCommentBody] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleDelete = () => {
    deleteTask.mutate(taskId, {
      onSuccess: () => {
        setDeleteConfirmOpen(false);
        router.push(`${base}/tasks/list?space_id=${task?.space_id ?? ""}`);
      },
    });
  };

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

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div>
            <input
              type="text"
              className="w-full border-0 bg-transparent text-2xl font-semibold focus:outline-none focus:ring-0"
              defaultValue={task.title}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== task.title) {
                  updateTask.mutate({ title: v });
                }
              }}
            />
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

          <div>
            <h3 className="font-medium mb-2">Comments</h3>
            <div className="flex gap-2">
              <Textarea
                placeholder="Write a comment..."
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                className="min-h-[80px]"
              />
              <Button
                size="icon"
                onClick={() => {
                  if (!commentBody.trim()) return;
                  createComment.mutate(
                    { body: commentBody.trim() },
                    {
                      onSuccess: () => setCommentBody(""),
                    }
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

        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Status</Label>
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
            <Label className="text-muted-foreground">Priority</Label>
            <Select
              value={task.priority}
              onValueChange={(v) => updateTask.mutate({ priority: v as TaskPriority })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-muted-foreground">Due date</Label>
            <Input
              type="date"
              className="mt-1"
              value={task.due_date ?? ""}
              onChange={(e) => {
                const v = e.target.value || null;
                updateTask.mutate({ due_date: v });
              }}
            />
          </div>

          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Activity</h3>
            <ul className="space-y-2 text-sm">
              {(activities ?? []).slice(0, 10).map((a) => (
                <li key={a.id} className="flex gap-2">
                  <span className="text-muted-foreground shrink-0">
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
