"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useSpaces,
  useSpaceLists,
  useSpaceStatuses,
  useCreateTask,
} from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import type { TaskPriority } from "@/lib/supabase/types";

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function NewTaskPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const base = `/${orgId}`;
  const spaceIdParam = searchParams.get("space_id") ?? "";

  const { data: spaces, isLoading: spacesLoading } = useSpaces(orgId);
  const { data: lists } = useSpaceLists(orgId, spaceIdParam || undefined);
  const { data: statuses } = useSpaceStatuses(orgId, spaceIdParam || undefined);
  const createTask = useCreateTask(orgId);

  const [spaceId, setSpaceId] = useState(spaceIdParam);
  const [listId, setListId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("none");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (spaceIdParam && !spaceId) setSpaceId(spaceIdParam);
  }, [spaceIdParam, spaceId]);

  useEffect(() => {
    if (spaces?.length && !spaceId) {
      setSpaceId(spaces[0].id);
    }
  }, [spaces, spaceId]);

  useEffect(() => {
    if (lists?.length && !listId) {
      setListId(lists[0].id);
    }
  }, [lists, listId]);

  const effectiveSpaceId = spaceId || spaces?.[0]?.id;
  const effectiveListId = listId || lists?.[0]?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t || !effectiveSpaceId || !effectiveListId) return;
    try {
      const task = await createTask.mutateAsync({
        space_id: effectiveSpaceId,
        list_id: effectiveListId,
        title: t,
        description: description.trim() || null,
        priority,
        due_date: dueDate || null,
      });
      router.push(`${base}/tasks/${task.id}`);
    } catch {
      // error toast
    }
  };

  if (spacesLoading || !spaces?.length) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`${base}/tasks/list?space_id=${effectiveSpaceId}`}>
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold">New task</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details..."
            className="mt-1 min-h-[100px]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Project</Label>
            <Select value={spaceId || effectiveSpaceId} onValueChange={(v) => { setSpaceId(v); setListId(""); }}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {spaces.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>List</Label>
            <Select value={listId || effectiveListId} onValueChange={setListId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select list" />
              </SelectTrigger>
              <SelectContent>
                {(lists ?? []).map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
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
            <Label htmlFor="due_date">Due date</Label>
            <Input
              id="due_date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={!title.trim() || createTask.isPending}>
            Create task
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`${base}/tasks/list?space_id=${effectiveSpaceId}`}>
              Cancel
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
