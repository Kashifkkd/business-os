"use client";

import { ChevronRight, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStageColors } from "@/lib/lead-stage-colors";
import type { LeadStatus } from "@/lib/supabase/types";

const PIPELINE_STAGES: { status: LeadStatus; label: string }[] = [
  { status: "new", label: "New" },
  { status: "contacted", label: "Contacted" },
  { status: "qualified", label: "Qualified" },
  { status: "proposal", label: "Proposal" },
  { status: "won", label: "Won" },
  { status: "lost", label: "Lost" },
];

type StageItem = { id: string; name: string; color?: string };

type LeadStatusPipelineProps = {
  /** When using stage-based pipeline (lead.stage_id). */
  stages?: StageItem[];
  currentStageId?: string;
  /** @deprecated Use stages + currentStageId. Kept for pipeline page until it uses stages API. */
  currentStatus?: LeadStatus;
  onAdvance?: () => void;
  onDisqualify?: () => void;
  className?: string;
  orientation?: "horizontal" | "vertical";
  compact?: boolean;
};

function getStageColorStyle() {
  return { bgMuted: "bg-muted", text: "text-foreground", border: "border-l-primary" };
}

export function LeadStatusPipeline({
  stages: stagesProp,
  currentStageId,
  currentStatus,
  onAdvance,
  onDisqualify,
  className,
  orientation = "horizontal",
  compact = false,
}: LeadStatusPipelineProps) {
  const useStages = Array.isArray(stagesProp) && stagesProp.length > 0 && currentStageId != null;
  const stages = useStages ? stagesProp! : PIPELINE_STAGES;
  const currentIndex = useStages
    ? stages.findIndex((s) => (s as StageItem).id === currentStageId)
    : PIPELINE_STAGES.findIndex((s) => s.status === currentStatus);
  const canAdvance = currentIndex >= 0 && currentIndex < stages.length - 1;
  const isLost = useStages
    ? (stages[currentIndex] as StageItem)?.name?.toLowerCase() === "lost"
    : currentStatus === "lost";
  const isWon = useStages
    ? (stages[currentIndex] as StageItem)?.name?.toLowerCase() === "won"
    : currentStatus === "won";
  const getStageLabel = (s: StageItem | (typeof PIPELINE_STAGES)[number]) =>
    "name" in s ? s.name : s.label;
  const getStageKey = (s: StageItem | (typeof PIPELINE_STAGES)[number]) =>
    "id" in s ? s.id : (s as (typeof PIPELINE_STAGES)[number]).status;

  if (orientation === "vertical") {
    return (
      <div className={cn("flex flex-col gap-0", className)}>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Stage
        </h2>
        <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-muted/40 dark:bg-muted/20">
          {stages.map((stage, i) => {
            const isActive = useStages ? (stage as StageItem).id === currentStageId : (stage as (typeof PIPELINE_STAGES)[number]).status === currentStatus;
            const isPast = currentIndex > i;
            const colors = useStages ? getStageColorStyle() : getStageColors((stage as (typeof PIPELINE_STAGES)[number]).status);
            return (
              <div
                key={getStageKey(stage as StageItem)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors",
                  isActive && colors.bgMuted,
                  isActive && colors.text,
                  isActive && "border-l-2",
                  isActive && colors.border,
                  isActive && "shadow-sm",
                  i > 0 && "border-t border-border/80",
                  !isActive && "text-muted-foreground",
                  !isActive && isPast && "text-foreground/70"
                )}
              >
                <span className="truncate">{getStageLabel(stage as StageItem)}</span>
                {isActive && canAdvance && onAdvance && (
                  <button
                    type="button"
                    onClick={onAdvance}
                    className="shrink-0 rounded p-0.5 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                    aria-label="Advance to next stage"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {!isLost && !isWon && onDisqualify && (
          <button
            type="button"
            onClick={onDisqualify}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-destructive/30 px-3 py-2 text-xs text-destructive transition-colors hover:bg-destructive/10"
            aria-label="Mark as lost"
          >
            <XCircle className="size-3.5" />
            Mark as lost
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5", compact && "gap-1", className)}>
      <div
        className={cn(
          "flex flex-1 overflow-hidden rounded-full border border-border",
          "bg-muted/40 dark:bg-muted/20",
          compact && "rounded-md"
        )}
      >
        {stages.map((stage, i) => {
          const isActive = useStages ? (stage as StageItem).id === currentStageId : (stage as (typeof PIPELINE_STAGES)[number]).status === currentStatus;
          const isPast = currentIndex > i;
          const colors = useStages ? getStageColorStyle() : getStageColors((stage as (typeof PIPELINE_STAGES)[number]).status);
          return (
            <div
              key={getStageKey(stage as StageItem)}
              className={cn(
                "relative flex min-w-0 flex-1 items-center justify-center font-medium transition-colors",
                compact
                  ? "px-2 py-1.5 text-[10px] sm:px-2.5"
                  : "px-3 py-2.5 text-xs sm:px-4",
                isActive && colors.bgMuted,
                isActive && colors.text,
                isActive && "shadow-sm",
                i === 0 && "rounded-l-full",
                i === stages.length - 1 && "rounded-r-full",
                compact && i === 0 && "rounded-l-md",
                compact && i === stages.length - 1 && "rounded-r-md",
                !isActive && "text-muted-foreground",
                !isActive && isPast && "text-foreground/70",
                i > 0 && !isActive && "border-l border-border/80"
              )}
            >
              <span className="truncate">{getStageLabel(stage as StageItem)}</span>
            </div>
          );
        })}
      </div>
      <div className={cn("flex shrink-0 items-center gap-0.5", compact && "gap-0")}>
        {canAdvance && onAdvance && (
          <button
            type="button"
            onClick={onAdvance}
            className={cn(
              "flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              compact ? "size-6" : "size-8"
            )}
            aria-label="Advance to next stage"
          >
            <ChevronRight className={cn(compact ? "size-3" : "size-4")} />
          </button>
        )}
        {!isLost && !isWon && onDisqualify && (
          <button
            type="button"
            onClick={onDisqualify}
            className={cn(
              "flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
              compact ? "size-6" : "size-8"
            )}
            aria-label="Mark as lost"
          >
            <XCircle className={cn(compact ? "size-3" : "size-4")} />
          </button>
        )}
      </div>
    </div>
  );
}
