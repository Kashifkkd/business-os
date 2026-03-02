"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSpaceLists } from "@/hooks/use-tasks";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { TASK_PRIORITY_OPTIONS } from "@/lib/task-priority";
import type { Task } from "@/lib/supabase/types";
import type { TaskStatus, TaskLabel } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { ChevronDown, User, Tag } from "lucide-react";

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  description: z.string().optional(),
  space_id: z.string().min(1, "Project is required"),
  list_id: z.string().min(1, "List is required"),
  status_id: z.string().optional(),
  priority: z.enum(["urgent", "high", "medium", "low", "none"]),
  due_date: z.string().optional(),
  start_date: z.string().optional(),
  assignee_ids: z.array(z.string()),
  label_ids: z.array(z.string()),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

type MemberInfo = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
};

function getMemberName(m: MemberInfo): string {
  if (m.first_name || m.last_name) {
    return [m.first_name, m.last_name].filter(Boolean).join(" ").trim();
  }
  return "Unknown";
}

export type TaskFormProps = {
  orgId: string;
  /** When set, form is in edit mode. */
  initialTask?: Task | null;
  /** For create mode: initial space to select (e.g. from URL). */
  defaultSpaceId?: string;
  spaces: { id: string; name: string }[];
  statuses: TaskStatus[];
  labels: TaskLabel[];
  members: MemberInfo[];
  onSubmit: (values: TaskFormValues) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelHref: string;
};

function getDefaultValues(initialTask?: Task | null, defaultSpaceId?: string): TaskFormValues {
  return {
    title: initialTask?.title ?? "",
    description: initialTask?.description ?? "",
    space_id: initialTask?.space_id ?? defaultSpaceId ?? "",
    list_id: initialTask?.list_id ?? "",
    status_id: initialTask?.status_id ?? "",
    priority: initialTask?.priority ?? "none",
    due_date: initialTask?.due_date ? initialTask.due_date.slice(0, 10) : "",
    start_date: initialTask?.start_date ? initialTask.start_date.slice(0, 10) : "",
    assignee_ids: initialTask?.assignee_ids ?? [],
    label_ids: initialTask?.label_ids ?? [],
  };
}

export function TaskForm({
  orgId,
  initialTask,
  defaultSpaceId,
  spaces,
  statuses,
  labels,
  members,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Create task",
  cancelHref,
}: TaskFormProps) {
  const isEdit = !!initialTask?.id;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: getDefaultValues(initialTask, defaultSpaceId),
  });

  const spaceId = form.watch("space_id");
  const { data: lists = [] } = useSpaceLists(orgId, spaceId || undefined);
  const filteredLists = lists;
  useEffect(() => {
    if (spaceId && filteredLists.length > 0) {
      const currentListId = form.getValues("list_id");
      const valid = filteredLists.some((l) => l.id === currentListId);
      if (!valid) {
        form.setValue("list_id", filteredLists[0].id);
      }
    }
  }, [spaceId, filteredLists, form]);

  return (
    <form
      onSubmit={form.handleSubmit((values) => onSubmit(values))}
      className="flex flex-col gap-6"
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            {...form.register("title")}
            placeholder="Task title"
            className="mt-1"
          />
          {form.formState.errors.title && (
            <p className="text-destructive text-sm mt-1">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...form.register("description")}
            placeholder="Add details..."
            className="mt-1 min-h-[100px]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Project *</Label>
            <Controller
              name="space_id"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    form.setValue("list_id", "");
                  }}
                  disabled={isEdit}
                >
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
              )}
            />
            {form.formState.errors.space_id && (
              <p className="text-destructive text-sm mt-1">{form.formState.errors.space_id.message}</p>
            )}
          </div>
          <div>
            <Label>List *</Label>
            <Controller
              name="list_id"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select list" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredLists.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.list_id && (
              <p className="text-destructive text-sm mt-1">{form.formState.errors.list_id.message}</p>
            )}
          </div>
        </div>

        {isEdit && statuses.length > 0 && (
          <div>
            <Label>Status</Label>
            <Controller
              name="status_id"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Priority</Label>
            <Controller
              name="priority"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
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
              )}
            />
          </div>
          <div>
            <Label htmlFor="due_date">Due date</Label>
            <Input
              id="due_date"
              type="date"
              {...form.register("due_date")}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="start_date">Start date</Label>
          <Input
            id="start_date"
            type="date"
            {...form.register("start_date")}
            className="mt-1"
          />
        </div>

        <div>
          <Label>Assignees</Label>
          <Controller
            name="assignee_ids"
            control={form.control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-1 w-full justify-between font-normal"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <User className="size-4 shrink-0" />
                      {field.value.length === 0
                        ? "Select assignees"
                        : `${field.value.length} selected`}
                    </span>
                    <ChevronDown className="size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {members.map((m) => (
                      <label
                        key={m.user_id}
                        className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted"
                      >
                        <Checkbox
                          checked={field.value.includes(m.user_id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value, m.user_id]);
                            } else {
                              field.onChange(field.value.filter((id) => id !== m.user_id));
                            }
                          }}
                        />
                        <span className="text-sm">{getMemberName(m)}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          />
        </div>

        <div>
          <Label>Labels</Label>
          <Controller
            name="label_ids"
            control={form.control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-1 w-full justify-between font-normal"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Tag className="size-4 shrink-0" />
                      {field.value.length === 0
                        ? "Select labels"
                        : `${field.value.length} selected`}
                    </span>
                    <ChevronDown className="size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {labels.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-2">No labels in this project.</p>
                    ) : (
                      labels.map((l) => (
                        <label
                          key={l.id}
                          className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted"
                        >
                          <Checkbox
                            checked={field.value.includes(l.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, l.id]);
                              } else {
                                field.onChange(field.value.filter((id) => id !== l.id));
                              }
                            }}
                          />
                          <Badge
                            variant="secondary"
                            className="text-xs font-normal"
                            style={l.color ? { borderLeftColor: l.color, backgroundColor: `${l.color}20`, borderLeftWidth: 4, borderLeftStyle: "solid" } : undefined}
                          >
                            {l.name}
                          </Badge>
                        </label>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href={cancelHref}>Cancel</a>
        </Button>
      </div>
    </form>
  );
}
