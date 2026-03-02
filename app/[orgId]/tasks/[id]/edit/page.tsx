"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useTask,
  useSpaces,
  useSpaceStatuses,
  useSpaceLabels,
  useUpdateTask,
} from "@/hooks/use-tasks";
import { useOrganization } from "@/hooks/use-organization";
import { TaskForm, type TaskFormValues } from "../../task-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const taskId = params?.id as string;
  const base = `/${orgId}`;

  const { data: task, isLoading: taskLoading, isError } = useTask(orgId, taskId);
  const { data: spaces = [] } = useSpaces(orgId);
  const { data: statuses = [] } = useSpaceStatuses(orgId, task?.space_id);
  const { data: labels = [] } = useSpaceLabels(orgId, task?.space_id);
  const { orgMembers = [] } = useOrganization(orgId, { enabled: !!orgId });
  const updateTask = useUpdateTask(orgId, taskId);

  const handleSubmit = async (values: TaskFormValues) => {
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
  }));

  if (!orgId || !taskId) return null;

  if (taskLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !task) {
    router.replace(`${base}/tasks/list`);
    return null;
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-auto">
      <div className="flex flex-col gap-6 p-6 max-w-2xl">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`${base}/tasks/${taskId}`}>
            <ArrowLeft className="mr-2 size-4" />
            Back to task
          </Link>
        </Button>

        <h1 className="text-2xl font-semibold">Edit task</h1>

        <TaskForm
          key={task.id}
          orgId={orgId}
          initialTask={task}
          spaces={spaces}
          statuses={statuses}
          labels={labels}
          members={membersForForm}
          onSubmit={handleSubmit}
          isSubmitting={updateTask.isPending}
          submitLabel="Save changes"
          cancelHref={`${base}/tasks/${taskId}`}
        />
      </div>
    </div>
  );
}
