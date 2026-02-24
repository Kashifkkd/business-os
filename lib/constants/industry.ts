import type { IndustryType } from "@/lib/supabase/types";

export const INDUSTRY_OPTIONS: { value: IndustryType; label: string }[] = [
  { value: "cafe", label: "Cafe" },
  { value: "real_estate", label: "Real estate" },
];
