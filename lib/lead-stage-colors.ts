import type { LeadStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export type StageColorVariant = "bg" | "border" | "text" | "ring" | "badge";

export const STAGE_COLORS: Record<
  LeadStatus,
  {
    bg: string;
    bgMuted: string;
    border: string;
    text: string;
    badge: string;
  }
> = {
  new: {
    bg: "bg-sky-500",
    bgMuted: "bg-sky-500/10 dark:bg-sky-500/15",
    border: "border-sky-500/40",
    text: "text-sky-700 dark:text-sky-400",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300",
  },
  contacted: {
    bg: "bg-amber-500",
    bgMuted: "bg-amber-500/10 dark:bg-amber-500/15",
    border: "border-amber-500/40",
    text: "text-amber-700 dark:text-amber-400",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  },
  qualified: {
    bg: "bg-emerald-500",
    bgMuted: "bg-emerald-500/10 dark:bg-emerald-500/15",
    border: "border-emerald-500/40",
    text: "text-emerald-700 dark:text-emerald-400",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  },
  proposal: {
    bg: "bg-violet-500",
    bgMuted: "bg-violet-500/10 dark:bg-violet-500/15",
    border: "border-violet-500/40",
    text: "text-violet-700 dark:text-violet-400",
    badge: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300",
  },
  won: {
    bg: "bg-green-500",
    bgMuted: "bg-green-500/10 dark:bg-green-500/15",
    border: "border-green-500/40",
    text: "text-green-700 dark:text-green-400",
    badge: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  },
  lost: {
    bg: "bg-slate-400",
    bgMuted: "bg-slate-400/10 dark:bg-slate-500/15",
    border: "border-slate-400/40 dark:border-slate-500/40",
    text: "text-slate-600 dark:text-slate-400",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400",
  },
};

export function getStageColors(status: LeadStatus) {
  return STAGE_COLORS[status] ?? STAGE_COLORS.new;
}

export function getStageBadgeClasses(status: LeadStatus) {
  return cn("rounded px-2 py-0.5 text-xs font-medium", getStageColors(status).badge);
}

export function getStageBorderClasses(status: LeadStatus) {
  return cn("border-l-4", getStageColors(status).border);
}
