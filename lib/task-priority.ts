import type { TaskPriority } from "@/lib/supabase/types";

export const TASK_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  none: "None",
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  none: "bg-muted text-muted-foreground",
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export function getPriorityLabel(priority: TaskPriority): string {
  return TASK_PRIORITY_LABELS[priority] ?? priority;
}

export function getPriorityClassName(priority: TaskPriority): string {
  return PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.none;
}
