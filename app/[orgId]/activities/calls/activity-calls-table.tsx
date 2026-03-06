"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { TableLoadingSkeleton } from "@/components/table-loading-skeleton";
import { DateDisplay } from "@/components/date-display";
import { Paginated } from "@/components/paginated";
import type { GetActivityCallsResult } from "@/hooks/use-activities";
import { Phone, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type ActivityCallsTableProps = {
  orgId: string;
  data: GetActivityCallsResult;
  searchParams: Record<string, string>;
  isLoading?: boolean;
  isRefetching?: boolean;
};

export function ActivityCallsTable({
  orgId,
  data,
  searchParams,
  isLoading = false,
  isRefetching = false,
}: ActivityCallsTableProps) {
  const pathname = `/${orgId}/activities/calls`;
  const page = data.page;
  const pageSize = data.pageSize;
  const total = data.total;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const params: Record<string, string> = { ...searchParams };
  delete params.page;
  delete params.pageSize;

  if (isLoading) {
    return <TableLoadingSkeleton columnCount={6} rowCount={10} />;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-muted-foreground text-sm">
        <span>
          {total === 0 ? "No calls" : `Showing ${from}–${to} of ${total}`}
        </span>
      </div>

      <div className="rounded-md border">
        {data.items.length === 0 ? (
          <EmptyState
            title="No calls"
            description="Log a call to track phone conversations."
            icon={Phone}
            action={
              <Button asChild size="sm">
                <Link href={`/${orgId}/activities/calls/new`}>Log call</Link>
              </Button>
            }
            className="min-h-[200px]"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-8 px-3 text-xs">Subject</TableHead>
                <TableHead className="h-8 px-3 text-xs">Type</TableHead>
                <TableHead className="h-8 px-3 text-xs">Status</TableHead>
                <TableHead className="h-8 px-3 text-xs">Start time</TableHead>
                <TableHead className="h-8 px-3 text-xs">Duration</TableHead>
                <TableHead className="h-8 w-10 px-3 text-xs" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((call) => (
                <TableRow
                  key={call.id}
                  className={cn(isRefetching && "opacity-70")}
                >
                  <TableCell className="px-3 py-2">
                    <Link
                      href={`/${orgId}/activities/calls/${call.id}`}
                      className="font-medium hover:underline"
                    >
                      {call.subject || "Call"}
                    </Link>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-muted-foreground text-sm capitalize">
                    {call.call_type}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-muted-foreground text-sm capitalize">
                    {call.call_status.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-muted-foreground text-sm">
                    <DateDisplay value={call.call_start_time} variant="datetime" />
                  </TableCell>
                  <TableCell className="px-3 py-2 text-muted-foreground text-sm">
                    {formatDuration(call.duration_seconds)}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Button variant="ghost" size="icon" className="size-8" asChild>
                      <Link href={`/${orgId}/activities/calls/${call.id}`}>
                        <Pencil className="size-3.5" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {totalPages > 1 && (
        <Paginated
          pathname={pathname}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          defaultPageSize={10}
          params={params}
        />
      )}
    </div>
  );
}
