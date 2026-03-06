"use client";

import { useParams, useRouter } from "next/navigation";
import {
  useTask,
  useTasks,
  useUpdateTask,
  useUpdateTaskById,
  useCreateTask,
  useSpaceStatuses,
} from "@/hooks/use-tasks";
import { useOrganization } from "@/hooks/use-organization";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectTaskEditorHeader } from "../_components/project-task-editor-header";
import { ProjectTaskActivityNotesPanel } from "../_components/project-task-activity-notes-panel";
import { TaskDetailPanel } from "./_components/task-detail-panel";
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
import { useState } from "react";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const taskId = params?.id as string;
  const base = `/${orgId}`;

  const { data: task, isLoading: taskLoading } = useTask(orgId, taskId);
  const { data: statuses } = useSpaceStatuses(orgId, task?.space_id ?? undefined);
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
  const deleteTask = useDeleteTask(orgId);

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
      { onSuccess: () => setNewSubtaskTitle("") }
    );
  };

  const membersForPanel = orgMembers.map((m) => ({
    user_id: m.user_id,
    first_name: m.first_name,
    last_name: m.last_name,
  }));

  if (taskLoading || !task) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-4 border-b border-border px-4 py-3">
          <Skeleton className="size-8 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[60%_1fr]">
          <Skeleton className="m-4 h-64" />
          <Skeleton className="m-4 h-64" />
        </div>
      </div>
    );
  }

  const listHref = `${base}/tasks/list?space_id=${task.space_id}`;
  const editHref = `${base}/tasks/${taskId}/edit`;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <ProjectTaskEditorHeader
        listHref={listHref}
        title={task.title}
        editHref={editHref}
        onDelete={() => setDeleteConfirmOpen(true)}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[60%_1fr]">
        <aside className="flex min-h-0 flex-col overflow-y-auto border-r border-border bg-background">
          <TaskDetailPanel
            task={task}
            orgId={orgId}
            base={base}
            statuses={statuses ?? []}
            members={membersForPanel}
            subtasks={subtasks}
            newSubtaskTitle={newSubtaskTitle}
            onNewSubtaskTitleChange={setNewSubtaskTitle}
            onAddSubtask={handleAddSubtask}
            onUpdate={(updates) => updateTask.mutate(updates)}
            onUpdateSubtask={(stId, statusId) =>
              updateTaskById.mutate({ taskId: stId, data: { status_id: statusId } })
            }
            doneStatusId={doneStatusId}
            isPending={updateTask.isPending}
          />
        </aside>

        <main className="flex min-h-0 flex-col overflow-hidden bg-muted/20">
          <h3 className="shrink-0 px-4 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Activities · Notes
          </h3>
          <div className="min-h-0 flex-1 overflow-hidden">
            <ProjectTaskActivityNotesPanel orgId={orgId} taskId={taskId} />
          </div>
        </main>
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              &quot;{task.title}&quot;.
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
