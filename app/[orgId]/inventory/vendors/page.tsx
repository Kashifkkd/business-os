"use client";

import { useParams } from "next/navigation";
import { useVendors } from "@/hooks/use-vendors";
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
import { Truck, Pencil, Plus } from "lucide-react";
import { isArrayWithValues } from "@/lib/is-array-with-values";
import Link from "next/link";

export default function VendorsPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const { data: vendors, isLoading } = useVendors(orgId);

  if (!orgId) return null;

  const items = vendors ?? [];

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-md font-semibold">Vendors</h1>
          <p className="text-muted-foreground text-xs">
            Suppliers for purchase orders and bills.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href={`/${orgId}/inventory/vendors/new`}>
            <Plus className="size-3.5" />
            Create
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <TableLoadingSkeleton columnCount={5} rowCount={5} compact />
      ) : isArrayWithValues(items) ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="h-8 px-3 text-xs">Name</TableHead>
                <TableHead className="h-8 px-3 text-xs">Email</TableHead>
                <TableHead className="h-8 px-3 text-xs">Phone</TableHead>
                <TableHead className="h-8 px-3 text-xs">Payment Terms</TableHead>
                <TableHead className="h-8 px-3 text-xs w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((v) => (
                <TableRow key={v.id} className="[&_td]:py-1.5 [&_td]:px-3 [&_td]:text-xs">
                  <TableCell>{v.name}</TableCell>
                  <TableCell className="text-muted-foreground">{v.email ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{v.phone ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[120px] truncate">
                    {v.payment_terms ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-xs" asChild>
                      <Link href={`/${orgId}/inventory/vendors/${v.id}`}>
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
          title="No vendors"
          description="Add vendors to create purchase orders."
          icon={Truck}
          action={
            <Button size="sm" asChild>
              <Link href={`/${orgId}/inventory/vendors/new`}>
                <Plus className="size-3.5" />
                Create vendor
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
