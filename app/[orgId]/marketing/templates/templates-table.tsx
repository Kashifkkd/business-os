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
import type { MarketingTemplate } from "@/lib/supabase/types";
import type { GetMarketingTemplatesResult } from "@/hooks/use-marketing";
import { FileText, Pencil } from "lucide-react";
import { isArrayWithValues } from "@/lib/is-array-with-values";

const columnHelper = createColumnHelper<MarketingTemplate>();

type TemplatesTableProps = {
  orgId: string;
  data: GetMarketingTemplatesResult;
  params: Record<string, string>;
  isLoading?: boolean;
};

export function TemplatesTable({
  orgId,
  data,
  params,
  isLoading = false,
}: TemplatesTableProps) {
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
        cell: (ctx) => <span className="font-medium">{ctx.getValue()}</span>,
      }),
      columnHelper.accessor("channel", {
        header: "Channel",
        cell: (ctx) => (
          <Badge variant="outline" className="text-[10px] font-normal capitalize">
            {ctx.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("subject", {
        header: "Subject",
        cell: (ctx) => (
          <span className="max-w-[200px] truncate text-muted-foreground text-sm block">
            {ctx.getValue() ?? "—"}
          </span>
        ),
      }),
      columnHelper.accessor("is_active", {
        header: "Active",
        cell: (ctx) => (
          <Badge variant={ctx.getValue() ? "default" : "secondary"} className="text-[10px] font-normal">
            {ctx.getValue() ? "Yes" : "No"}
          </Badge>
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
            <Link href={`/${orgId}/marketing/templates/${row.original.id}`}>
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
          {total === 0 ? "No templates" : `Showing ${from}–${to} of ${total} templates`}
        </p>
        <Button size="sm" asChild>
          <Link href={`/${orgId}/marketing/templates/new`}>
            <FileText className="size-3.5" />
            New template
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
          title="No templates"
          description="Create email, SMS, or other channel templates for your campaigns."
          icon={FileText}
          action={
            <Button asChild>
              <Link href={`/${orgId}/marketing/templates/new`}>New template</Link>
            </Button>
          }
        />
      )}

      {totalPages > 1 && (
        <Paginated
          pathname={`/${orgId}/marketing/templates`}
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
