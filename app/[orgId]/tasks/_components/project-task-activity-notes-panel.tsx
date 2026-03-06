"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  useTaskActivities,
  useTaskComments,
  useCreateTaskComment,
} from "@/hooks/use-tasks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Send, StickyNote } from "lucide-react";

type ProjectTaskActivityNotesPanelProps = {
  orgId: string;
  taskId?: string | null;
};

export function ProjectTaskActivityNotesPanel({
  orgId,
  taskId,
}: ProjectTaskActivityNotesPanelProps) {
  const [commentBody, setCommentBody] = useState("");
  const hasTask = !!taskId;

  const { data: activities = [], isLoading: activitiesLoading } =
    useTaskActivities(orgId, taskId ?? undefined);
  const { data: comments = [], isLoading: commentsLoading } =
    useTaskComments(orgId, taskId ?? undefined);
  const createComment = useCreateTaskComment(orgId, taskId ?? "");

  const handleAddComment = () => {
    const body = commentBody.trim();
    if (!body || !taskId) return;
    createComment.mutate(
      { body },
      { onSuccess: () => setCommentBody("") }
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Tabs defaultValue="activity" className="flex h-full flex-col">
        <TabsList className="mx-4 mt-3 h-8 w-auto shrink-0 gap-0 rounded-lg p-0.5">
          <TabsTrigger value="activity" className="h-7 gap-1.5 px-3 text-xs">
            <Activity className="size-3.5" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="notes" className="h-7 gap-1.5 px-3 text-xs">
            <StickyNote className="size-3.5" />
            Notes
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="activity"
          className="mt-3 flex-1 overflow-y-auto px-4 pb-4 data-[state=inactive]:hidden"
        >
          {!hasTask ? (
            <EmptyState
              icon={<Activity className="size-10 text-muted-foreground/40" />}
              title="No activity yet"
              description="Activity will appear here after the task is created"
            />
          ) : activitiesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : activities.length === 0 ? (
            <EmptyState
              icon={<Activity className="size-10 text-muted-foreground/40" />}
              title="No activity yet"
              description="Changes to this task will appear here"
            />
          ) : (
            <ul className="space-y-3">
              {activities.map((a) => (
                <li key={a.id} className="flex gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Activity className="size-3 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">
                      {a.actor_name ?? "Someone"}{" "}
                      {a.action_type.replace(/_/g, " ")}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      {format(new Date(a.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
        <TabsContent
          value="notes"
          className="mt-3 flex flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
        >
          {!hasTask ? (
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <EmptyState
                icon={<StickyNote className="size-10 text-muted-foreground/40" />}
                title="No notes yet"
                description="Add notes about this task after creating it"
              />
            </div>
          ) : (
            <>
              <div className="flex shrink-0 gap-2 px-4 pb-3">
                <Textarea
                  placeholder="Write a note or comment…"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  className="min-h-[72px] resize-none text-sm"
                  disabled={createComment.isPending}
                />
                <Button
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={handleAddComment}
                  disabled={!commentBody.trim() || createComment.isPending}
                  aria-label="Add note"
                >
                  <Send className="size-4" />
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                {commentsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : comments.length === 0 ? (
                  <EmptyState
                    icon={<StickyNote className="size-10 text-muted-foreground/40" />}
                    title="No notes yet"
                    description="Add a note or comment above"
                  />
                ) : (
                  <ul className="space-y-3">
                    {comments.map((c) => (
                      <li
                        key={c.id}
                        className="rounded-lg border bg-background/60 p-3 text-sm"
                      >
                        <p className="text-muted-foreground text-xs">
                          {c.author_name ?? "Someone"} ·{" "}
                          {format(new Date(c.created_at), "MMM d, yyyy h:mm a")}
                        </p>
                        <p className="mt-1.5 whitespace-pre-wrap">{c.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      {icon}
      <p className="mt-3 text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground/80">{description}</p>
    </div>
  );
}
