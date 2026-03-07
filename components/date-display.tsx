"use client";

import {
  formatDate,
  formatDateTime,
  formatTime,
  formatTimeAgo,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export type DateDisplayVariant = "date" | "datetime" | "timeAgo" | "datetimeWithAgo";

export type DateDisplayLayout = "inline" | "column";

type DateDisplayProps = {
  /** ISO date string or Date */
  value: string | Date | null | undefined;
  /** What to show: date only, date+time, time ago, or date + (time ago if recent else time) */
  variant?: DateDisplayVariant;
  /** inline = single line; column = date on first line, time/ago on second (for table cells) */
  layout?: DateDisplayLayout;
  /** For variant "datetimeWithAgo": show "time ago" when within this many days, else show time (default 7) */
  timeAgoWithinDays?: number;
  /** Locale for Intl (default en-US) */
  locale?: string;
  /** Time format from org settings: 12h (e.g. 1:10 AM) or 24h (e.g. 13:10) */
  timeFormat?: "12h" | "24h";
  /** Placeholder when value is null/undefined (default "—") */
  placeholder?: string;
  className?: string;
};

function isWithinDays(d: Date, days: number): boolean {
  const diffMs = Date.now() - d.getTime();
  return diffMs >= 0 && diffMs < days * 24 * 60 * 60 * 1000;
}

export function DateDisplay({
  value,
  variant = "date",
  layout = "inline",
  timeAgoWithinDays = 7,
  locale,
  timeFormat,
  placeholder = "—",
  className,
}: DateDisplayProps) {
  if (value == null) {
    return <span className={cn("text-muted-foreground", className)}>{placeholder}</span>;
  }

  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) {
    return <span className={cn("text-muted-foreground", className)}>{placeholder}</span>;
  }

  const dateStr = formatDate(d, locale);
  const datetimeStr = formatDateTime(d, locale, timeFormat);
  const timeStr = formatTime(d, locale, timeFormat);
  const timeAgoStr = formatTimeAgo(d, locale);

  if (layout === "column" && (variant === "datetime" || variant === "timeAgo" || variant === "datetimeWithAgo")) {
    const useAgo = variant === "datetimeWithAgo" && isWithinDays(d, timeAgoWithinDays);
    const secondLine =
      variant === "datetime"
        ? timeStr
        : variant === "timeAgo"
          ? timeAgoStr
          : useAgo
            ? formatTimeAgo(d, locale)
            : timeStr;

    const firstLine = variant === "datetimeWithAgo" && useAgo ? secondLine : dateStr;
    const secondLineFinal = variant === "datetimeWithAgo" && useAgo ? dateStr : secondLine;

    return (
      <div
        className={cn(
          "flex flex-col gap-0.5 text-xs",
          className
        )}
      >
        <span>{firstLine}</span>
        <span className="text-muted-foreground">{secondLineFinal}</span>
      </div>
    );
  }

  if (variant === "datetimeWithAgo") {
    const useAgo = isWithinDays(d, timeAgoWithinDays);
    const text = useAgo ? timeAgoStr : datetimeStr;
    return <span className={cn("text-xs", className)}>{text}</span>;
  }

  const text =
    variant === "date"
      ? dateStr
      : variant === "datetime"
        ? datetimeStr
        : timeAgoStr;

  return <span className={cn("text-xs", className)}>{text}</span>;
}
