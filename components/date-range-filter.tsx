"use client";

import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Preset keys stored in URL. Use dateRangeToApiParams() to derive API params at call time. */
export type DatePresetId =
  | "allTime"
  | "today"
  | "yesterday"
  | "last15"
  | "thisWeek"
  | "thisMonth"
  | "lastMonth"
  | "custom";

export type DateRangeValue = {
  presetId?: DatePresetId;
  from: string;
  to: string;
  label: string;
};

/** Local date in yyyy-MM-dd (avoids UTC timezone bugs). */
function toLocalDateStr(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export const DATE_PRESETS: { id: DatePresetId; label: string; getValue: () => DateRangeValue }[] = [
  {
    id: "allTime",
    label: "All time",
    getValue: () => {
      const end = new Date();
      const start = new Date(2000, 0, 1);
      return {
        presetId: "allTime",
        from: toLocalDateStr(start),
        to: toLocalDateStr(end),
        label: "All time",
      };
    },
  },
  {
    id: "today",
    label: "Today",
    getValue: () => {
      const d = new Date();
      const s = toLocalDateStr(d);
      return { presetId: "today", from: s, to: s, label: "Today" };
    },
  },
  {
    id: "yesterday",
    label: "Yesterday",
    getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const s = toLocalDateStr(d);
      return { presetId: "yesterday", from: s, to: s, label: "Yesterday" };
    },
  },
  {
    id: "last15",
    label: "Last 15 days",
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 14);
      return {
        presetId: "last15",
        from: toLocalDateStr(start),
        to: toLocalDateStr(end),
        label: "Last 15 days",
      };
    },
  },
  {
    id: "thisWeek",
    label: "This week",
    getValue: () => {
      const d = new Date();
      const start = new Date(d);
      start.setDate(start.getDate() - start.getDay());
      return {
        presetId: "thisWeek",
        from: toLocalDateStr(start),
        to: toLocalDateStr(d),
        label: "This week",
      };
    },
  },
  {
    id: "thisMonth",
    label: "This month",
    getValue: () => {
      const d = new Date();
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date();
      return {
        presetId: "thisMonth",
        from: toLocalDateStr(start),
        to: toLocalDateStr(end),
        label: "This month",
      };
    },
  },
  {
    id: "lastMonth",
    label: "Last month",
    getValue: () => {
      const d = new Date();
      const start = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const end = new Date(d.getFullYear(), d.getMonth(), 0);
      return {
        presetId: "lastMonth",
        from: toLocalDateStr(start),
        to: toLocalDateStr(end),
        label: "Last month",
      };
    },
  },
];

/**
 * Derive API date params from preset key and optional custom dates.
 * Call this right before API requests so presets like "today" are always fresh.
 */
export function dateRangeToApiParams(
  presetId: DatePresetId | string,
  customFrom?: string,
  customTo?: string
): { dateFrom?: string; dateTo?: string } {
  if (presetId === "allTime" || !presetId) return {};
  if (presetId === "custom") {
    const from = (customFrom ?? "").trim().slice(0, 10);
    const to = (customTo ?? "").trim().slice(0, 10);
    if (from && to) return { dateFrom: from, dateTo: to };
    return {};
  }
  const preset = DATE_PRESETS.find((p) => p.id === presetId);
  if (!preset) return {};
  const v = preset.getValue();
  return { dateFrom: v.from, dateTo: v.to };
}

/** Parse date-only string (yyyy-MM-dd) as local noon to avoid timezone off-by-one. */
function parseDateSafe(s: string): Date {
  const trimmed = (s ?? "").slice(0, 10);
  if (!trimmed || trimmed.length < 10) return new Date();
  return new Date(trimmed + "T12:00:00");
}

function formatRangeLabel(from: string, to: string): string {
  const a = parseDateSafe(from);
  const b = parseDateSafe(to);
  return `${format(a, "LLL dd, y")} – ${format(b, "LLL dd, y")}`;
}

/** If value matches a preset, return preset label; otherwise return formatted date range (custom). */
function getDisplayLabel(value: DateRangeValue): string {
  if (value.presetId === "custom") return value.label || formatRangeLabel(value.from, value.to);
  if (value.presetId) {
    const preset = DATE_PRESETS.find((p) => p.id === value.presetId);
    return preset?.label ?? value.label;
  }
  return value.label || formatRangeLabel(value.from, value.to);
}


export interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  placeholder?: string;
  className?: string;
  /** Optional: align popover (default "end") */
  align?: "start" | "end" | "center";
}

export function DateRangeFilter({
  value,
  onChange,
  placeholder = "Date range",
  className,
  align = "end",
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setCustomFrom(value.from);
      setCustomTo(value.to);
    }, 0);
    return () => clearTimeout(t);
  }, [open, value]);

  const handlePreset = useCallback(
    (preset: (typeof DATE_PRESETS)[number]) => {
      const next = preset.getValue();
      onChange(next);
      setOpen(false);
    },
    [onChange]
  );

  const handleCustomApply = useCallback(() => {
    const from = customFrom || toLocalDateStr(new Date());
    const to = customTo || from;
    const fromDate = parseDateSafe(from);
    const toDate = parseDateSafe(to);
    if (fromDate > toDate) {
      onChange({
        presetId: "custom",
        from: to,
        to: from,
        label: formatRangeLabel(to, from),
      });
    } else {
      onChange({
        presetId: "custom",
        from,
        to,
        label: formatRangeLabel(from, to),
      });
    }
    setOpen(false);
  }, [customFrom, customTo, onChange]);

  const chipLabel = getDisplayLabel(value);
  const selectedPresetId = (() => {
    if (value.presetId) return value.presetId;
    const from = (value.from ?? "").slice(0, 10);
    const to = (value.to ?? "").slice(0, 10);
    const today = toLocalDateStr(new Date());
    if (from === "2000-01-01" && to === today) return "allTime";
    for (const p of DATE_PRESETS) {
      if (p.id === "allTime") continue;
      const v = p.getValue();
      if (v.from === from && v.to === to) return p.id;
    }
    return "custom";
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 justify-between gap-1.5 font-normal",
            className
          )}
          aria-label={placeholder}
        >
          <CalendarIcon className="size-3.5 text-muted-foreground" />
          <span className="min-w-0 truncate">
            {chipLabel || placeholder}
          </span>
          <ChevronDownIcon className="size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="flex flex-col">
          <div className="border-b p-2">
            <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
              Presets
            </p>
            <div className="grid grid-cols-2 gap-0.5">
              {DATE_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={cn(
                      "rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                      isSelected && "bg-muted font-medium"
                    )}
                    onClick={() => handlePreset(preset)}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="border-t p-3">
            <p className="text-muted-foreground mb-2 px-0.5 text-xs font-medium">
              Custom range
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-full justify-start font-normal"
                        >
                          <CalendarIcon className="mr-2 size-3.5 text-muted-foreground" />
                          {customFrom
                            ? format(parseDateSafe(customFrom), "LLL dd, y")
                            : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customFrom ? parseDateSafe(customFrom) : undefined}
                          onSelect={(d) => d && setCustomFrom(format(d, "yyyy-MM-dd"))}
                          defaultMonth={customFrom ? parseDateSafe(customFrom) : new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">To</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-full justify-start font-normal"
                        >
                          <CalendarIcon className="mr-2 size-3.5 text-muted-foreground" />
                          {customTo
                            ? format(parseDateSafe(customTo), "LLL dd, y")
                            : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customTo ? parseDateSafe(customTo) : undefined}
                          onSelect={(d) => d && setCustomTo(format(d, "yyyy-MM-dd"))}
                          defaultMonth={customTo ? parseDateSafe(customTo) : new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              <Button size="sm" className="w-full" onClick={handleCustomApply}>
                Apply range
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Returns default range (All time) for initial state. */
export function getDefaultDateRange(): DateRangeValue {
  return DATE_PRESETS[0].getValue(); // All time
}
