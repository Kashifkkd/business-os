import type { LeadStage } from "@/lib/supabase/types";

export type LeadStageItem = Pick<LeadStage, "id" | "name" | "color" | "sort_order" | "is_default"> & {
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  /** Resolved from profiles for display */
  created_by_name?: string | null;
  /** Resolved from profiles for avatar image */
  created_by_avatar_url?: string | null;
};

export const DEFAULT_STAGE_COLOR = "#64748b";

/** Normalize hex color for stages (same as lead-sources). */
export function normalizeStageColor(hex: string | undefined): string {
  if (!hex || typeof hex !== "string") return DEFAULT_STAGE_COLOR;
  const trimmed = hex.trim();
  if (trimmed.startsWith("#")) return trimmed.slice(0, 7) || DEFAULT_STAGE_COLOR;
  return `#${trimmed.slice(0, 6)}` || DEFAULT_STAGE_COLOR;
}
