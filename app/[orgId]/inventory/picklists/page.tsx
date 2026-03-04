"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { usePicklistsPaginated } from "@/hooks/use-picklists";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isArrayWithValues } from "@/lib/is-array-with-values";
import { ListFilter, Pencil } from "lucide-react";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

export default function PicklistsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const orgId = params?.orgId as string;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const setParams = useCallback(
    (updates: { page?: number; status?: string }) => {
      const next = new URLSearchParams(searchParams.toString());
      const p = updates.page ?? Math.max(1, Number(searchParams.get("page")) || 1);
      const st = updates.status ?? searchParams.get("status") ?? "";
      if (p > 1) next.set("page", String(p));
      else next.delete("page");
      if (st) next.set("status", st);
      else next.delete("status");
      router.push(`${pathname}${next.toString() ? `?${next}` : ""}`);
    },
    [pathname, router, searchParams]
  );

  const page = Math.max(1, Number(searchParams.get("page")) || DEFAULT_PAGE);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE));
  const status = searchParams.get("status") ?? "";

  const { data, isLoading, isRefetching } = usePicklistsPaginated(
    orgId,
    { page, pageSize, status: status || undefined },
    { enabled: !!orgId && mounted }
  );

  const tableData = data ?? { items: [], total: 0, page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE };
  const totalPages = Math.max(1, Math.ceil(tableData.total / tableData.pageSize));
  const from = tableData.total === 0 ? 0 : (tableData.page - 1) * tableData.pageSize + 1;
  const to = Math.min(tableData.page * tableData.pageSize, tableData.total);

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-md font-semibold">Picklists</h1>
          <p className="text-muted-foreground text-xs">
            Warehouse picking documents for sales orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={status || "all"}
            onValueChange={(v) => setParams({ status: v === "all" ? "" : v, page: 1 })}
          >
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="picked">Picked</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" asChild>
            <Link href={`/${orgId}/inventory/picklists/new`}>
              <ListFilter className="size-3.5" />
              Create
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          {tableData.total === 0 ? "No picklists" : `Showing ${from}–${to} of ${tableData.total}`}
        </p>
        {isLoading || isRefetching ? (
          <TableLoadingSkeleton columnCount={5} rowCount={8} compact />
        ) : isArrayWithValues(tableData.items) ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="h-8 px-3 text-xs">Sales order</TableHead>
                  <TableHead className="h-8 px-3 text-xs">Warehouse</TableHead>
                  <TableHead className="h-8 px-3 text-xs">Status</TableHead>
                  <TableHead className="h-8 px-3 text-xs w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.items.map((pl) => (
                  <TableRow key={pl.id} className="[&_td]:py-1.5 [&_td]:px-3 [&_td]:text-xs">
                    <TableCell>{pl.sales_order_number ?? pl.sales_order_id.slice(0, 8)}</TableCell>
                    <TableCell>{pl.warehouse_name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        {pl.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-xs" asChild>
                        <Link href={`/${orgId}/inventory/picklists/${pl.id}`}>
                          <Pencil className="size-3" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="No picklists"
            description="Create a picklist from a sales order."
            icon={ListFilter}
            action={
              <Button size="sm" asChild>
                <Link href={`/${orgId}/inventory/picklists/new`}>Create picklist</Link>
              </Button>
            }
          />
        )}
        <Paginated
          pathname={pathname}
          page={tableData.page}
          pageSize={tableData.pageSize}
          totalPages={totalPages}
          defaultPageSize={10}
          params={status ? { status } : {}}
        />
      </div>
    </div>
  );
}
