"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { normalizeStageColor } from "@/lib/lead-stages";

type StageChipProps = {
  /** Stage display name. */
  name: string | null | undefined;
  /** Optional hex color for the stage; when missing, a default neutral is used. */
  color?: string | null;
  className?: string;
};

/**
 * Reusable chip for pipeline/stage display. Shows stage name with optional
 * stage color (light background + colored text). Use in tables, cards, and
 * detail views wherever stages are shown.
 */
export function StageChip({ name, color, className }: StageChipProps) {
  if (name == null || name === "") {
    return <span className={cn("text-muted-foreground text-[10px]", className)}>—</span>;
  }

  const hex = normalizeStageColor(color ?? undefined);

  return (
    <Badge
      variant="secondary"
      className={cn("text-[10px] font-normal border-0", className)}
      style={{
        backgroundColor: `${hex}20`,
        color: hex,
      }}
    >
      {String(name).trim() || "—"}
    </Badge>
  );
}
