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
import { DateDisplay } from "@/components/date-display";
import type { MarketingJourney } from "@/lib/supabase/types";
import type { GetMarketingJourneysResult } from "@/hooks/use-marketing";
import { Workflow, Pencil } from "lucide-react";
import { isArrayWithValues } from "@/lib/is-array-with-values";

const columnHelper = createColumnHelper<MarketingJourney>();

const STATUS_VARIANTS: Record<string, "secondary" | "default" | "outline"> = {
  draft: "secondary",
  active: "default",
  paused: "outline",
};

type JourneysTableProps = {
  orgId: string;
  data: GetMarketingJourneysResult;
  isLoading?: boolean;
};

export function JourneysTable({
  orgId,
  data,
  isLoading = false,
}: JourneysTableProps) {
  const total = data.total;

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (ctx) => <span className="font-medium">{ctx.getValue()}</span>,
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (ctx) => (
          <Badge variant={STATUS_VARIANTS[ctx.getValue()] ?? "secondary"} className="text-[10px] font-normal">
            {ctx.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("trigger_type", {
        header: "Trigger",
        cell: (ctx) => (
          <span className="text-muted-foreground text-sm capitalize">
            {String(ctx.getValue()).replace(/_/g, " ")}
          </span>
        ),
      }),
      columnHelper.accessor("steps", {
        header: "Steps",
        cell: (ctx) => (
          <span className="text-muted-foreground text-sm">
            {Array.isArray(ctx.getValue()) ? ctx.getValue().length : 0} steps
          </span>
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
            <Link href={`/${orgId}/marketing/journeys/${row.original.id}`}>
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
          {total === 0 ? "No journeys" : `${total} journey${total !== 1 ? "s" : ""}`}
        </p>
        <Button size="sm" asChild>
          <Link href={`/${orgId}/marketing/journeys/new`}>
            <Workflow className="size-3.5" />
            New journey
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <TableLoadingSkeleton columnCount={6} rowCount={10} compact />
      ) : isArrayWithValues(data.items) ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-8 px-3 text-xs">
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
          title="No journeys"
          description="Create automated flows triggered by lead events."
          icon={Workflow}
          action={
            <Button asChild>
              <Link href={`/${orgId}/marketing/journeys/new`}>New journey</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
