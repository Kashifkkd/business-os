"use client";

import { useParams, useRouter } from "next/navigation";
import {
  useTask,
  useSpaces,
  useSpaceStatuses,
  useUpdateTask,
} from "@/hooks/use-tasks";
import { useOrganization } from "@/hooks/use-organization";
import {
  ProjectTaskFormEditor,
  type ProjectTaskFormValues,
} from "../../_components/project-task-form-editor";
import { ProjectTaskEditorHeader } from "../../_components/project-task-editor-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const taskId = params?.id as string;
  const base = `/${orgId}`;

  const { data: task, isLoading: taskLoading, isError } = useTask(orgId, taskId);
  const { data: spaces = [] } = useSpaces(orgId);
  const { data: statuses = [] } = useSpaceStatuses(orgId, task?.space_id);
  const { orgMembers = [] } = useOrganization(orgId, { enabled: !!orgId });
  const updateTask = useUpdateTask(orgId, taskId);

  const handleSubmit = async (values: ProjectTaskFormValues) => {
    try {
      await updateTask.mutateAsync({
        list_id: values.list_id,
        status_id: values.status_id ?? undefined,
        title: values.title,
        description: values.description?.trim() || null,
        priority: values.priority,
        due_date: values.due_date || null,
        start_date: values.start_date || null,
        assignee_ids: values.assignee_ids,
        label_ids: values.label_ids,
      });
      router.push(`${base}/tasks/${taskId}`);
    } catch {
      // Error handled by mutation
    }
  };

  const membersForForm = orgMembers.map((m) => ({
    user_id: m.user_id,
    first_name: m.first_name,
    last_name: m.last_name,
    avatar_url: null as string | null,
  }));

  if (!orgId || !taskId) return null;

  if (taskLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-4 border-b border-border px-4 py-3">
          <Skeleton className="size-8 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex min-h-0 flex-1 gap-6 p-6">
          <Skeleton className="h-64 flex-1" />
          <Skeleton className="hidden h-64 w-72 lg:block" />
        </div>
      </div>
    );
  }

  if (isError || !task) {
    router.replace(`${base}/tasks/list`);
    return null;
  }

  const taskHref = `${base}/tasks/${taskId}`;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <ProjectTaskEditorHeader
        listHref={taskHref}
        title="Edit"
        onSave={() =>
          (
            document.getElementById("project-task-form") as HTMLFormElement | null
          )?.requestSubmit?.()
        }
        isSubmitting={updateTask.isPending}
        submitLabel="Save"
      />

      <ProjectTaskFormEditor
        key={task.id}
        orgId={orgId}
        initialTask={task}
        spaces={spaces}
        statuses={statuses}
        members={membersForForm}
        onSubmit={handleSubmit}
        isSubmitting={updateTask.isPending}
        submitLabel="Save changes"
        cancelHref={taskHref}
      />
    </div>
  );
}
