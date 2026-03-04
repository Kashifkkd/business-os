"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useSpaces,
  useSpaceStatuses,
  useSpaceLabels,
  useCreateTask,
} from "@/hooks/use-tasks";
import { useOrganization } from "@/hooks/use-organization";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { TaskForm, TaskFormValues } from "../task-form";

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
  const { data: labels = [] } = useSpaceLabels(orgId, selectedSpaceId || undefined);
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

  const handleSubmit = async (values: TaskFormValues) => {
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
  }));

  if (spacesLoading || !spaces?.length) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-auto">
      <div className="mx-auto w-full max-w-6xl space-y-4 px-2 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-row items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`${base}/tasks/list?space_id=${effectiveSpaceId}`} className="gap-1.5">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-md font-semibold tracking-tight text-foreground">
              New task
            </h1>
          </div>
        </div>

        <div className="pt-2">
          <TaskForm
            orgId={orgId}
            defaultSpaceId={effectiveSpaceId}
            spaces={spaces}
            statuses={statuses ?? []}
            labels={labels}
            members={membersForForm}
            onSubmit={handleSubmit}
            isSubmitting={createTask.isPending}
            submitLabel="Create task"
            cancelHref={`${base}/tasks/list?space_id=${effectiveSpaceId}`}
          />
        </div>
      </div>
    </div>
  );
}
