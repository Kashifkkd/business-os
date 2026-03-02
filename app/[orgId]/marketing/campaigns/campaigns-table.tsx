"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { TableLoadingSkeleton } from "@/components/table-loading-skeleton";
import { Paginated } from "@/components/paginated";
import { DateDisplay } from "@/components/date-display";
import type { MarketingCampaign } from "@/lib/supabase/types";
import type { GetMarketingCampaignsResult } from "@/hooks/use-marketing";
import { FolderKanban, Pencil } from "lucide-react";
import { isArrayWithValues } from "@/lib/is-array-with-values";

const STATUS_VARIANTS: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  draft: "secondary",
  scheduled: "outline",
  running: "default",
  paused: "secondary",
  completed: "outline",
};

const columnHelper = createColumnHelper<MarketingCampaign>();

type CampaignsTableProps = {
  orgId: string;
  data: GetMarketingCampaignsResult;
  params: Record<string, string>;
  isLoading?: boolean;
};

export function CampaignsTable({
  orgId,
  data,
  params,
  isLoading = false,
}: CampaignsTableProps) {
  const page = data.page;
  const pageSize = data.pageSize;
  const total = data.total;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (ctx) => (
          <span className="font-medium">{ctx.getValue()}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (ctx) => (
          <Badge variant={STATUS_VARIANTS[ctx.getValue()] ?? "secondary"} className="text-[10px] font-normal">
            {String(ctx.getValue()).replace(/_/g, " ")}
          </Badge>
        ),
      }),
      columnHelper.accessor("primary_channel", {
        header: "Channel",
        cell: (ctx) => (
          <span className="text-muted-foreground text-sm capitalize">
            {ctx.getValue() ?? "—"}
          </span>
        ),
      }),
      columnHelper.accessor("objective", {
        header: "Objective",
        cell: (ctx) => (
          <span className="max-w-[180px] truncate text-muted-foreground text-sm block">
            {ctx.getValue() ?? "—"}
          </span>
        ),
      }),
      columnHelper.accessor("starts_at", {
        header: "Starts",
        cell: (ctx) => (
          <DateDisplay value={ctx.getValue()} variant="date" layout="column" />
        ),
      }),
      columnHelper.accessor("created_at", {
        header: "Created",
        cell: (ctx) => (
          <DateDisplay value={ctx.getValue()} variant="timeAgo" layout="column" />
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${orgId}/marketing/campaigns/${row.original.id}`}>
              <Pencil className="size-3.5" />
              <span className="sr-only">Edit</span>
            </Link>
          </Button>
        ),
      }),
    ],
    [orgId]
  );

  const table = useReactTable({
    data: data.items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {total === 0
            ? "No campaigns"
            : `Showing ${from}–${to} of ${total} campaigns`}
        </p>
        <Button size="sm" asChild>
          <Link href={`/${orgId}/marketing/campaigns/new`}>
            <FolderKanban className="size-3.5" />
            New campaign
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <TableLoadingSkeleton columnCount={7} rowCount={10} compact />
      ) : isArrayWithValues(data.items) ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-8 px-3 text-xs"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-1.5 px-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No campaigns"
          description="Create a campaign to target segments and run multi-channel outreach."
          icon={FolderKanban}
          action={
            <Button asChild>
              <Link href={`/${orgId}/marketing/campaigns/new`}>
                New campaign
              </Link>
            }
          />
      )}

      {totalPages > 1 && (
        <Paginated
          pathname={`/${orgId}/marketing/campaigns`}
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
