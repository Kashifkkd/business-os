"use client";

import {
  formatDate,
  formatDateTime,
  formatTime,
  formatTimeAgo,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export type DateDisplayVariant = "date" | "datetime" | "timeAgo";

export type DateDisplayLayout = "inline" | "column";

type DateDisplayProps = {
  /** ISO date string or Date */
  value: string | Date | null | undefined;
  /** What to show: date only, date+time, or relative (time ago) */
  variant?: DateDisplayVariant;
  /** inline = single line; column = date on first line, time/ago on second (for table cells) */
  layout?: DateDisplayLayout;
  /** Locale for Intl (default en-US) */
  locale?: string;
  /** Placeholder when value is null/undefined (default "—") */
  placeholder?: string;
  className?: string;
};

export function DateDisplay({
  value,
  variant = "date",
  layout = "inline",
  locale,
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
  const datetimeStr = formatDateTime(d, locale);
  const timeAgoStr = formatTimeAgo(d, locale);

  if (layout === "column" && (variant === "datetime" || variant === "timeAgo")) {
    return (
      <div
        className={cn(
          "flex flex-col gap-0.5 text-xs",
          className
        )}
      >
        <span>{dateStr}</span>
        <span className="text-muted-foreground">
          {variant === "datetime" ? formatTime(d, locale) : timeAgoStr}
        </span>
      </div>
    );
  }

  const text =
    variant === "date"
      ? dateStr
      : variant === "datetime"
        ? datetimeStr
        : timeAgoStr;

  return <span className={cn("text-xs", className)}>{text}</span>;
}
