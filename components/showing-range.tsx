import { cn } from "@/lib/utils";

type ShowingRangeProps = {
  /** 1-based start index (e.g. 1) */
  from: number;
  /** 1-based end index (e.g. 7) */
  to: number;
  /** Total count */
  total: number;
  /** Plural item label (e.g. "sources", "leads", "items") */
  itemLabel: string;
  /** Shown when total === 0 (e.g. "No sources") */
  emptyLabel?: string;
  className?: string;
};

/**
 * Displays "Showing from–to of total itemLabel" or emptyLabel when total is 0.
 * Use above tables/lists for consistent count display.
 */
export function ShowingRange({
  from,
  to,
  total,
  itemLabel,
  emptyLabel,
  className,
}: ShowingRangeProps) {
  if (total === 0) {
    return (
      <p className={cn("text-muted-foreground text-sm", className)}>
        {emptyLabel ?? `No ${itemLabel}`}
      </p>
    );
  }

  return (
    <p className={cn("text-muted-foreground text-sm", className)}>
      Showing{" "}
      <span className="font-medium tabular-nums text-foreground">{from}–{to}</span>
      {" of "}
      <span className="font-medium tabular-nums text-foreground">{total}</span>
      {" "}{itemLabel}
    </p>
  );
}
