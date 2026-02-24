"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

type TableLoadingSkeletonProps = {
  /** Number of columns (default 6) */
  columnCount?: number;
  /** Number of rows (default 10) */
  rowCount?: number;
  /** Compact row height (default true) */
  compact?: boolean;
};

export function TableLoadingSkeleton({
  columnCount = 6,
  rowCount = 10,
  compact = true,
}: TableLoadingSkeletonProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {Array.from({ length: columnCount }).map((_, i) => (
              <TableHead
                key={i}
                className={compact ? "h-8 px-3 text-xs" : undefined}
              >
                <Skeleton className="h-4 w-16" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columnCount }).map((_, colIndex) => (
                <TableCell
                  key={colIndex}
                  className={
                    compact
                      ? "py-1.5 px-3 [&_.skeleton]:h-4"
                      : undefined
                  }
                >
                  <Skeleton
                    className={
                      colIndex === 0 ? "h-4 w-24" : "h-4 w-full max-w-[120px]"
                    }
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
