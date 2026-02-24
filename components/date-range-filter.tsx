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

export type DateRangeValue = {
  from: string;
  to: string;
  label: string;
};

const PRESETS: { id: string; label: string; getValue: () => DateRangeValue }[] = [
  {
    id: "today",
    label: "Today",
    getValue: () => {
      const d = new Date();
      const s = d.toISOString().slice(0, 10);
      return { from: s, to: s, label: "Today" };
    },
  },
  {
    id: "yesterday",
    label: "Yesterday",
    getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const s = d.toISOString().slice(0, 10);
      return { from: s, to: s, label: "Yesterday" };
    },
  },
  {
    id: "last7",
    label: "Last 7 days",
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return {
        from: start.toISOString().slice(0, 10),
        to: end.toISOString().slice(0, 10),
        label: "Last 7 days",
      };
    },
  },
  {
    id: "last30",
    label: "Last 30 days",
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      return {
        from: start.toISOString().slice(0, 10),
        to: end.toISOString().slice(0, 10),
        label: "Last 30 days",
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
        from: start.toISOString().slice(0, 10),
        to: end.toISOString().slice(0, 10),
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
        from: start.toISOString().slice(0, 10),
        to: end.toISOString().slice(0, 10),
        label: "Last month",
      };
    },
  },
];

function formatRangeLabel(from: string, to: string): string {
  const a = new Date(from);
  const b = new Date(to);
  return `${format(a, "LLL dd, y")} – ${format(b, "LLL dd, y")}`;
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
    (preset: (typeof PRESETS)[number]) => {
      const next = preset.getValue();
      onChange(next);
      setOpen(false);
    },
    [onChange]
  );

  const handleCustomApply = useCallback(() => {
    const from = customFrom || format(new Date(), "yyyy-MM-dd");
    const to = customTo || from;
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (fromDate > toDate) {
      onChange({ from: to, to: from, label: formatRangeLabel(to, from) });
    } else {
      onChange({ from, to, label: formatRangeLabel(from, to) });
    }
    setOpen(false);
  }, [customFrom, customTo, onChange]);

  const chipLabel = value.label;

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
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={cn(
                    "rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                    value.label === preset.label && "bg-muted font-medium"
                  )}
                  onClick={() => handlePreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
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
                            ? format(new Date(customFrom), "LLL dd, y")
                            : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customFrom ? new Date(customFrom) : undefined}
                          onSelect={(d) => d && setCustomFrom(format(d, "yyyy-MM-dd"))}
                          defaultMonth={customFrom ? new Date(customFrom) : new Date()}
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
                            ? format(new Date(customTo), "LLL dd, y")
                            : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customTo ? new Date(customTo) : undefined}
                          onSelect={(d) => d && setCustomTo(format(d, "yyyy-MM-dd"))}
                          defaultMonth={customTo ? new Date(customTo) : new Date()}
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

/** Returns default range (e.g. Last 7 days) for initial state. */
export function getDefaultDateRange(): DateRangeValue {
  return PRESETS[2].getValue(); // Last 7 days
}
