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
import type { GetActivityMeetingsResult } from "@/hooks/use-activities";
import { Video, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type ActivityMeetingsTableProps = {
  orgId: string;
  data: GetActivityMeetingsResult;
  searchParams: Record<string, string>;
  isLoading?: boolean;
  isRefetching?: boolean;
};

export function ActivityMeetingsTable({
  orgId,
  data,
  searchParams,
  isLoading = false,
  isRefetching = false,
}: ActivityMeetingsTableProps) {
  const pathname = `/${orgId}/activities/meetings`;
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
    return <TableLoadingSkeleton columnCount={5} rowCount={10} />;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-muted-foreground text-sm">
        <span>
          {total === 0 ? "No meetings" : `Showing ${from}–${to} of ${total}`}
        </span>
      </div>

      <div className="rounded-md border">
        {data.items.length === 0 ? (
          <EmptyState
            title="No meetings"
            description="Schedule a meeting to track appointments."
            icon={Video}
            action={
              <Button asChild size="sm">
                <Link href={`/${orgId}/activities/meetings/new`}>
                  Schedule meeting
                </Link>
              </Button>
            }
            className="min-h-[200px]"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-8 px-3 text-xs">Title</TableHead>
                <TableHead className="h-8 px-3 text-xs">Related</TableHead>
                <TableHead className="h-8 px-3 text-xs">Start</TableHead>
                <TableHead className="h-8 px-3 text-xs">End</TableHead>
                <TableHead className="h-8 w-10 px-3 text-xs" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((meeting) => (
                <TableRow
                  key={meeting.id}
                  className={cn(isRefetching && "opacity-70")}
                >
                  <TableCell className="px-3 py-2">
                    <Link
                      href={`/${orgId}/activities/meetings/${meeting.id}`}
                      className="font-medium hover:underline"
                    >
                      {meeting.title}
                    </Link>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-muted-foreground text-sm">
                    {meeting.lead_id ? (
                      <Link
                        href={`/${orgId}/leads/${meeting.lead_id}`}
                        className="hover:underline"
                      >
                        Lead
                      </Link>
                    ) : meeting.deal_id ? (
                      <Link
                        href={`/${orgId}/sales/deals/${meeting.deal_id}`}
                        className="hover:underline"
                      >
                        Deal
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-muted-foreground text-sm">
                    <DateDisplay value={meeting.start_time} variant="datetime" />
                  </TableCell>
                  <TableCell className="px-3 py-2 text-muted-foreground text-sm">
                    <DateDisplay value={meeting.end_time} variant="datetime" />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Button variant="ghost" size="icon" className="size-8" asChild>
                      <Link href={`/${orgId}/activities/meetings/${meeting.id}`}>
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
