/** A lead source option with optional display color (hex). Used in chips and filters. */
export type LeadSourceItem = {
  name: string;
  color: string;
  /** Set when loaded from API (table row). */
  id?: string;
  created_at?: string;
  created_by?: string | null;
  /** Display name for created_by (if resolved). */
  created_by_name?: string | null;
};

export const DEFAULT_SOURCE_COLOR = "#64748b";

/** Palette for source color picker (hex, label). */
export const SOURCE_COLOR_PALETTE: { value: string; label: string }[] = [
  { value: "#64748b", label: "Slate" },
  { value: "#2563eb", label: "Blue" },
  { value: "#059669", label: "Emerald" },
  { value: "#7c3aed", label: "Violet" },
  { value: "#d97706", label: "Amber" },
  { value: "#dc2626", label: "Red" },
  { value: "#db2777", label: "Pink" },
  { value: "#0891b2", label: "Cyan" },
  { value: "#4f46e5", label: "Indigo" },
  { value: "#16a34a", label: "Green" },
];

/** Normalize hex to ensure it has # and is 7 chars. */
export function normalizeSourceColor(hex: string | undefined): string {
  if (!hex || typeof hex !== "string") return DEFAULT_SOURCE_COLOR;
  const trimmed = hex.trim();
  if (trimmed.startsWith("#")) return trimmed.slice(0, 7) || DEFAULT_SOURCE_COLOR;
  return `#${trimmed.slice(0, 6)}` || DEFAULT_SOURCE_COLOR;
}

/** Build a map of source name -> color from sources list. */
export function sourceColorMap(sources: LeadSourceItem[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const s of sources) {
    if (s.name?.trim()) map[s.name.trim()] = normalizeSourceColor(s.color);
  }
  return map;
}
