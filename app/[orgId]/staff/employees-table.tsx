"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import type { Employee } from "@/lib/supabase/types";
import type { GetEmployeesResult } from "@/hooks/use-employees";
import { UserPlus, Pencil, Trash2 } from "lucide-react";
import { isArrayWithValues } from "@/lib/is-array-with-values";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<Employee>();

type EmployeesTableProps = {
  orgId: string;
  data: GetEmployeesResult;
  params: {
    page?: string;
    pageSize?: string;
    search?: string;
    department_id?: string;
    designation_id?: string;
    is_active?: string;
  };
  isLoading?: boolean;
  onDelete?: (employee: Employee) => void;
};

export function EmployeesTable({
  orgId,
  data,
  params,
  isLoading = false,
  onDelete,
}: EmployeesTableProps) {
  const pathname = usePathname();
  const { items, page, pageSize, total } = data;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const columns = useMemo(
    () => [
      columnHelper.accessor(
        (row) => row.display_name ?? row.employee_number ?? "—",
        {
          id: "display_name",
          header: "Name",
          cell: (ctx) => (
            <Link
              href={`/${orgId}/staff/${ctx.row.original.id}`}
              className="font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
            >
              {ctx.getValue()}
            </Link>
          ),
        }
      ),
      columnHelper.accessor((row) => row.employee_number, {
        id: "employee_number",
        header: "Employee #",
        cell: (ctx) => (
          <span className="text-muted-foreground">{ctx.getValue() ?? "—"}</span>
        ),
      }),
      columnHelper.accessor((row) => row.department_name, {
        id: "department_name",
        header: "Department",
        cell: (ctx) => (
          <span className="text-muted-foreground">{ctx.getValue() ?? "—"}</span>
        ),
      }),
      columnHelper.accessor((row) => row.designation_name, {
        id: "designation_name",
        header: "Designation",
        cell: (ctx) => (
          <span className="text-muted-foreground">{ctx.getValue() ?? "—"}</span>
        ),
      }),
      columnHelper.accessor((row) => row.reports_to_name, {
        id: "reports_to_name",
        header: "Reports to",
        cell: (ctx) => (
          <span className="text-muted-foreground">{ctx.getValue() ?? "—"}</span>
        ),
      }),
      columnHelper.accessor((row) => row.is_active, {
        id: "is_active",
        header: "Status",
        cell: (ctx) => (
          <Badge
            variant={ctx.getValue() ? "default" : "secondary"}
            className={cn("text-[10px] font-normal", !ctx.getValue() && "opacity-80")}
          >
            {ctx.getValue() ? "Active" : "Inactive"}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" asChild>
              <Link href={`/${orgId}/staff/${row.original.id}`}>
                <Pencil className="size-3" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onDelete(row.original)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-3" />
                <span className="sr-only">Delete</span>
              </Button>
            )}
          </div>
        ),
      }),
    ],
    [orgId, onDelete]
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const searchParamsForPaginated = {
    ...(params.search && { search: params.search }),
    ...(params.department_id && { department_id: params.department_id }),
    ...(params.designation_id && { designation_id: params.designation_id }),
    ...(params.is_active !== undefined && params.is_active !== "" && { is_active: params.is_active }),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {total === 0
            ? "No employees"
            : `Showing ${from}–${to} of ${total} employees`}
        </p>
        <Button size="sm" asChild>
          <Link href={`/${orgId}/staff/new`}>
            <UserPlus className="size-3.5" />
            Add employee
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <TableLoadingSkeleton columnCount={7} rowCount={10} compact />
      ) : isArrayWithValues(items) ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-muted/50 hover:bg-muted/50"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-8 px-3 text-xs"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="[&_td]:py-1.5 [&_td]:px-3 [&_td]:text-xs"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title={params.search ? "No results for your search" : "No employees"}
          description={
            params.search
              ? "Try a different search term or clear the search."
              : "Add your first employee to get started."
          }
          icon={UserPlus}
          action={
            params.search ? undefined : (
              <Button size="sm" asChild>
                <Link href={`/${orgId}/staff/new`}>
                  <UserPlus className="size-3.5" />
                  Add employee
                </Link>
              </Button>
            )

          }
        />
      )}

      {totalPages > 1 && (
        <Paginated
          pathname={pathname}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          defaultPageSize={10}
          params={searchParamsForPaginated}
        />
      )}
    </div>
  );
}
