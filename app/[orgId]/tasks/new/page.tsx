"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  useSpaces,
  useSpaceStatuses,
  useCreateTask,
} from "@/hooks/use-tasks";
import { useOrganization } from "@/hooks/use-organization";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import {
  ProjectTaskFormEditor,
  type ProjectTaskFormValues,
} from "../_components/project-task-form-editor";
import { ProjectTaskEditorHeader } from "../_components/project-task-editor-header";

export default function NewTaskPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const base = `/${orgId}`;
  const spaceIdParam = searchParams.get("space_id") ?? "";

  const { data: spaces, isLoading: spacesLoading } = useSpaces(orgId);
  const [selectedSpaceId, setSelectedSpaceId] = useState(spaceIdParam);
  const { data: statuses } = useSpaceStatuses(orgId, selectedSpaceId || undefined);
  const { orgMembers = [] } = useOrganization(orgId, { enabled: !!orgId });
  const createTask = useCreateTask(orgId);

  useEffect(() => {
    if (spaceIdParam) setSelectedSpaceId(spaceIdParam);
  }, [spaceIdParam]);
  useEffect(() => {
    if (spaces?.length && !selectedSpaceId) {
      setSelectedSpaceId(spaces[0].id);
    }
  }, [spaces, selectedSpaceId]);

  const effectiveSpaceId = selectedSpaceId || spaces?.[0]?.id;
  const listHref = `${base}/tasks/list?space_id=${effectiveSpaceId}`;

  const handleSubmit = async (values: ProjectTaskFormValues) => {
    try {
      const task = await createTask.mutateAsync({
        space_id: values.space_id,
        list_id: values.list_id,
        title: values.title,
        description: values.description?.trim() || null,
        priority: values.priority,
        due_date: values.due_date || null,
        start_date: values.start_date || null,
        assignee_ids: values.assignee_ids,
        label_ids: values.label_ids.length > 0 ? values.label_ids : undefined,
      });
      router.push(`${base}/tasks/${task.id}`);
    } catch {
      // Error handled by mutation / toast can be added
    }
  };

  const membersForForm = orgMembers.map((m) => ({
    user_id: m.user_id,
    first_name: m.first_name,
    last_name: m.last_name,
    avatar_url: null as string | null,
  }));

  if (spacesLoading || !spaces?.length) {
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

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <ProjectTaskEditorHeader
        listHref={listHref}
        title="New Task"
        onSave={() =>
          (document.getElementById("project-task-form") as HTMLFormElement | null)
            ?.requestSubmit?.()
        }
        isSubmitting={createTask.isPending}
        submitLabel="Create"
      />

      <ProjectTaskFormEditor
        orgId={orgId}
        defaultSpaceId={effectiveSpaceId}
        spaces={spaces}
        statuses={statuses ?? []}
        members={membersForForm}
        onSubmit={handleSubmit}
        isSubmitting={createTask.isPending}
        submitLabel="Create task"
        cancelHref={listHref}
      />
    </div>
  );
}
