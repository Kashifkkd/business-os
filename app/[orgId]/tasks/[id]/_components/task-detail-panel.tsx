"use client";

import { useSpaceLabels, useCreateLabel } from "@/hooks/use-tasks";
import { SearchCombobox } from "@/components/ui/search-combobox";
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Checkbox } from "@/components/ui/checkbox";
import { TASK_PRIORITY_OPTIONS } from "@/lib/task-priority";
import type { Task, TaskStatus } from "@/lib/supabase/types";
import type { TaskPriority } from "@/lib/supabase/types";
import { ListTodo, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

type TaskDetailPanelProps = {
  task: Task;
  orgId: string;
  base: string;
  statuses: TaskStatus[];
  members: MemberInfo[];
  subtasks: Task[];
  newSubtaskTitle: string;
  onNewSubtaskTitleChange: (v: string) => void;
  onAddSubtask: () => void;
  onUpdate: (updates: Partial<{
    title: string;
    description: string | null;
    status_id: string;
    priority: TaskPriority;
    due_date: string | null;
    start_date: string | null;
    assignee_ids: string[];
    label_ids: string[];
  }>) => void;
  onUpdateSubtask: (taskId: string, statusId: string) => void;
  doneStatusId?: string;
  isPending: boolean;
};

export function TaskDetailPanel({
  task,
  orgId,
  base,
  statuses,
  members,
  subtasks,
  newSubtaskTitle,
  onNewSubtaskTitleChange,
  onAddSubtask,
  onUpdate,
  onUpdateSubtask,
  doneStatusId,
  isPending,
}: TaskDetailPanelProps) {
  const { data: labels = [] } = useSpaceLabels(orgId, task.space_id);
  const createLabel = useCreateLabel(orgId, task.space_id);

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

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <Input
          value={task.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== task.title) onUpdate({ title: v });
          }}
          placeholder="Task title"
          className="h-10 border-0 bg-transparent text-base font-semibold shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={isPending}
        />
        <p className="text-muted-foreground mt-1 text-xs">
          {task.space_name} · {task.list_name}
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Details
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <DetailRow label="Status">
            <SearchCombobox
              options={statusOptions}
              value={task.status_id}
              onValueChange={(v) => onUpdate({ status_id: v })}
              placeholder="Select status"
              emptyMessage="No status found."
              disabled={isPending}
              className="h-9 rounded-lg"
            />
          </DetailRow>
          <DetailRow label="Priority">
            <SearchCombobox
              options={priorityOptions}
              value={task.priority}
              onValueChange={(v) => onUpdate({ priority: v as TaskPriority })}
              placeholder="Select priority"
              emptyMessage="No priority found."
              disabled={isPending}
              className="h-9 rounded-lg"
            />
          </DetailRow>
          <DetailRow label="Due date">
            <DatePicker
              value={task.due_date ?? ""}
              onChange={(v) => onUpdate({ due_date: v || null })}
              placeholder="Pick due date"
              disabled={isPending}
              className="h-9 rounded-lg"
            />
          </DetailRow>
          <DetailRow label="Start date">
            <DatePicker
              value={task.start_date ?? ""}
              onChange={(v) => onUpdate({ start_date: v || null })}
              placeholder="Pick start date"
              disabled={isPending}
              className="h-9 rounded-lg"
            />
          </DetailRow>
          <DetailRow label="Assignees" className="col-span-2">
            <MultiSelectCombobox
              options={memberOptions}
              value={task.assignee_ids ?? []}
              onValueChange={(v) => onUpdate({ assignee_ids: v })}
              placeholder="Search assignees…"
              emptyMessage="No members found."
              disabled={isPending}
              className="h-9 rounded-lg"
            />
          </DetailRow>
          <DetailRow label="Labels" className="col-span-2">
            <MultiSelectCombobox
              options={labelOptions}
              value={task.label_ids ?? []}
              onValueChange={(v) => onUpdate({ label_ids: v })}
              placeholder="Search labels…"
              emptyMessage="No labels found."
              disabled={isPending}
              className="h-9 rounded-lg"
              onCreateOption={async (name) => {
                const label = await createLabel.mutateAsync({ name: name.trim() });
                return label.id;
              }}
              createOptionLabel={(input) => `Create tag "${input}"`}
            />
          </DetailRow>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Description
        </label>
        <RichTextEditor
          content={task.description ?? ""}
          onChange={(html) => {
            const isEmpty = !html || html === "<p></p>" || html.trim() === "";
            onUpdate({ description: isEmpty ? null : html });
          }}
          placeholder="Add a description…"
          minHeight="160px"
          disabled={isPending}
          editorKey={`${task.id}-${task.updated_at ?? ""}`}
          mode="blur"
          className="rounded-lg border"
        />
      </div>

      <div className="space-y-2">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ListTodo className="size-3.5" />
          Subtasks
          {subtasks.length > 0 && (
            <span className="font-normal normal-case">
              {subtasks.filter((s) => s.status_type === "done").length}/{subtasks.length}
            </span>
          )}
        </h3>
        <ul className="space-y-2">
          {subtasks.map((st) => (
            <li
              key={st.id}
              className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
            >
              <Checkbox
                checked={st.status_type === "done"}
                onCheckedChange={(checked) => {
                  if (!doneStatusId) return;
                  onUpdateSubtask(st.id, doneStatusId);
                }}
              />
              <Link
                href={`${base}/tasks/${st.id}`}
                className={cn(
                  "min-w-0 flex-1 truncate hover:underline",
                  st.status_type === "done" && "text-muted-foreground line-through"
                )}
              >
                {st.title}
              </Link>
              <Button variant="ghost" size="icon" className="size-8 shrink-0" asChild>
                <Link href={`${base}/tasks/${st.id}`} aria-label="Open subtask">
                  <Pencil className="size-3.5" />
                </Link>
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input
            placeholder="Add a subtask..."
            value={newSubtaskTitle}
            onChange={(e) => onNewSubtaskTitleChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAddSubtask()}
            className="h-9 flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-9"
            onClick={onAddSubtask}
            disabled={!newSubtaskTitle.trim() || isPending}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[70px_1fr] items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/20",
        className
      )}
    >
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <div className="min-w-0 w-full">{children}</div>
    </div>
  );
}
