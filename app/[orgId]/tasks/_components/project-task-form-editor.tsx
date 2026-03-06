"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSpaceLists, useSpaceLabels, useCreateLabel } from "@/hooks/use-tasks";
import { Input } from "@/components/ui/input";
import { SearchCombobox } from "@/components/ui/search-combobox";
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { RichTextEditor } from "@/components/rich-text-editor";
import { TASK_PRIORITY_OPTIONS } from "@/lib/task-priority";
import type { Task } from "@/lib/supabase/types";
import type { TaskStatus } from "@/lib/supabase/types";
import { ProjectTaskActivityNotesPanel } from "./project-task-activity-notes-panel";

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

export type ProjectTaskFormValues = z.infer<typeof taskFormSchema>;

type MemberInfo = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url?: string | null;
};

function getMemberName(m: MemberInfo): string {
  if (m.first_name || m.last_name) {
    return [m.first_name, m.last_name].filter(Boolean).join(" ").trim();
  }
  return "Unknown";
}

type ProjectTaskFormEditorProps = {
  orgId: string;
  initialTask?: Task | null;
  defaultSpaceId?: string;
  spaces: { id: string; name: string }[];
  statuses: TaskStatus[];
  members: MemberInfo[];
  onSubmit: (values: ProjectTaskFormValues) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelHref: string;
};

function getDefaultValues(
  initialTask?: Task | null,
  defaultSpaceId?: string
): ProjectTaskFormValues {
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

export function ProjectTaskFormEditor({
  orgId,
  initialTask,
  defaultSpaceId,
  spaces,
  statuses,
  members,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Create task",
  cancelHref,
}: ProjectTaskFormEditorProps) {
  const isEdit = !!initialTask?.id;

  const form = useForm<ProjectTaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: getDefaultValues(initialTask, defaultSpaceId),
  });

  const spaceId = form.watch("space_id");
  const { data: lists = [] } = useSpaceLists(orgId, spaceId || undefined);
  const { data: labels = [] } = useSpaceLabels(orgId, spaceId || undefined);
  const createLabel = useCreateLabel(orgId, spaceId || "");
  const filteredLists = lists;

  const spaceOptions = spaces.map((s) => ({ value: s.id, label: s.name }));
  const listOptions = filteredLists.map((l) => ({ value: l.id, label: l.name }));
  const statusOptions = statuses.map((s) => ({ value: s.id, label: s.name }));
  const priorityOptions = TASK_PRIORITY_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }));
  const memberOptions = members.map((m) => ({
    value: m.user_id,
    label: getMemberName(m),
  }));
  const labelOptions = labels.map((l) => ({ value: l.id, label: l.name }));

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
      id="project-task-form"
      onSubmit={form.handleSubmit((values) => onSubmit(values))}
      className="flex h-full flex-col overflow-hidden"
    >
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[60%_1fr]">
        <aside className="flex min-h-0 flex-col overflow-y-auto border-r border-border bg-background">
          <div className="flex flex-col gap-4 p-4">
            <div>
              <Input
                {...form.register("title")}
                placeholder="Task title"
                className="border-0 bg-transparent text-base font-semibold text-xl shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isSubmitting}
              />
              {form.formState.errors.title && (
                <p className="text-destructive mt-1 text-xs">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
            
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <MetadataRow label="Project">
              <Controller
                name="space_id"
                control={form.control}
                render={({ field }) => (
                  <SearchCombobox
                    options={spaceOptions}
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue("list_id", "");
                    }}
                    placeholder="Select project"
                    emptyMessage="No project found."
                    disabled={isEdit}
                    className="h-9 rounded-lg"
                  />
                )}
              />
              {form.formState.errors.space_id && (
                <p className="text-destructive mt-1 text-xs">
                  {form.formState.errors.space_id.message}
                </p>
              )}
            </MetadataRow>

            <MetadataRow label="List">
              <Controller
                name="list_id"
                control={form.control}
                render={({ field }) => (
                  <SearchCombobox
                    options={listOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select list"
                    emptyMessage="No list found."
                    disabled={isSubmitting}
                    className="h-9 rounded-lg"
                  />
                )}
              />
              {form.formState.errors.list_id && (
                <p className="text-destructive mt-1 text-xs">
                  {form.formState.errors.list_id.message}
                </p>
              )}
            </MetadataRow>

            {isEdit && statuses.length > 0 && (
              <MetadataRow label="Status">
                <Controller
                  name="status_id"
                  control={form.control}
                  render={({ field }) => (
                    <SearchCombobox
                      options={statusOptions}
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      placeholder="Select status"
                      emptyMessage="No status found."
                      disabled={isSubmitting}
                      className="h-9 rounded-lg"
                    />
                  )}
                />
              </MetadataRow>
            )}

            <MetadataRow label="Priority">
              <Controller
                name="priority"
                control={form.control}
                render={({ field }) => (
                  <SearchCombobox
                    options={priorityOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select priority"
                    emptyMessage="No priority found."
                    disabled={isSubmitting}
                    className="h-9 rounded-lg"
                  />
                )}
              />
            </MetadataRow>

            <MetadataRow label="Due date">
              <Controller
                name="due_date"
                control={form.control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Pick due date"
                    disabled={isSubmitting}
                    className="h-9 rounded-lg"
                  />
                )}
              />
            </MetadataRow>

            <MetadataRow label="Start date">
              <Controller
                name="start_date"
                control={form.control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Pick start date"
                    disabled={isSubmitting}
                    className="h-9 rounded-lg"
                  />
                )}
              />
            </MetadataRow>

            <MetadataRow label="Assignees">
              <Controller
                name="assignee_ids"
                control={form.control}
                render={({ field }) => (
                  <MultiSelectCombobox
                    options={memberOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Search assignees…"
                    emptyMessage="No members found."
                    disabled={isSubmitting}
                    className="h-9 rounded-lg"
                  />
                )}
              />
            </MetadataRow>

            <MetadataRow label="Labels">
              <Controller
                name="label_ids"
                control={form.control}
                render={({ field }) => (
                  <MultiSelectCombobox
                    options={labelOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Search labels…"
                    emptyMessage="No labels found."
                    disabled={isSubmitting}
                    className="h-9 rounded-lg"
                    onCreateOption={
                      spaceId
                        ? async (name) => {
                            const label = await createLabel.mutateAsync({
                              name: name.trim(),
                            });
                            return label.id;
                          }
                        : undefined
                    }
                    createOptionLabel={(input) => `Create tag "${input}"`}
                  />
                )}
              />
            </MetadataRow>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Description
              </label>
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <RichTextEditor
                    content={field.value ?? ""}
                    onChange={(html) => {
                      const isEmpty =
                        !html || html === "<p></p>" || html.trim() === "";
                      field.onChange(isEmpty ? "" : html);
                    }}
                    placeholder="Add a description…"
                    minHeight="160px"
                    disabled={isSubmitting}
                    editorKey={initialTask?.id ?? "new"}
                    mode="live"
                    className="rounded-lg border"
                  />
                )}
              />
            </div>
          </div>
        </aside>

        <main className="flex min-h-0 flex-col overflow-hidden bg-muted/20">
          <h3 className="shrink-0 px-4 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Activities · Notes
          </h3>
          <div className="min-h-0 flex-1 overflow-hidden">
            <ProjectTaskActivityNotesPanel
              orgId={orgId}
              taskId={initialTask?.id}
            />
          </div>
        </main>
      </div>
    </form>
  );
}

function MetadataRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[70px_1fr] items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/20">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <div className="min-w-0 w-full">{children}</div>
    </div>
  );
}
