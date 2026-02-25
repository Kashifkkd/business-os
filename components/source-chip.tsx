"use client";

import { cn } from "@/lib/utils";
import { normalizeSourceColor } from "@/lib/lead-sources";

type SourceChipProps = {
  /** Source label (e.g. "website", "referral"). */
  source: string | null | undefined;
  /** Optional hex color; if missing, a default neutral is used. */
  color?: string | null;
  className?: string;
};

/**
 * Chip for lead source. Same shape/size as status Badge (rounded-4xl, h-5, etc.)
 * but with source-specific colors for background, border, and text.
 */
export function SourceChip({ source, color, className }: SourceChipProps) {
  if (source == null || source === "") {
    return <span className={cn("text-muted-foreground", className)}>—</span>;
  }

  const hex = normalizeSourceColor(color ?? undefined);
  const label = String(source).replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center whitespace-nowrap rounded-4xl border border-transparent px-2 py-0.5 text-[11px] font-medium capitalize text-white",
        className
      )}
      style={{
        backgroundColor: hex,
      }}
    >
      {label}
    </span>
  );
}
