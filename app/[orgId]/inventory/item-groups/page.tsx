"use client";

import { useParams } from "next/navigation";
import { useInventoryItemGroups } from "@/hooks/use-inventory-item-groups";
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
import { Shapes, Pencil, Plus } from "lucide-react";
import { isArrayWithValues } from "@/lib/is-array-with-values";
import Link from "next/link";

export default function ItemGroupsPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const { data: groups, isLoading } = useInventoryItemGroups(orgId);

  if (!orgId) return null;

  const items = groups ?? [];

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-md font-semibold">Item Groups</h1>
          <p className="text-muted-foreground text-xs">
            Categories for organizing inventory items.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href={`/${orgId}/inventory/item-groups/new`}>
            <Plus className="size-3.5" />
            Create
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <TableLoadingSkeleton columnCount={4} rowCount={5} compact />
      ) : isArrayWithValues(items) ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="h-8 px-3 text-xs">Name</TableHead>
                <TableHead className="h-8 px-3 text-xs">Description</TableHead>
                <TableHead className="h-8 px-3 text-xs">Sort Order</TableHead>
                <TableHead className="h-8 px-3 text-xs w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((g) => (
                <TableRow key={g.id} className="[&_td]:py-1.5 [&_td]:px-3 [&_td]:text-xs">
                  <TableCell>{g.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {g.description ?? "—"}
                  </TableCell>
                  <TableCell>{g.sort_order}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-xs" asChild>
                      <Link href={`/${orgId}/inventory/item-groups/${g.id}`}>
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
          title="No item groups"
          description="Create groups to organize your inventory items."
          icon={Shapes}
          action={
            <Button size="sm" asChild>
              <Link href={`/${orgId}/inventory/item-groups/new`}>
                <Plus className="size-3.5" />
                Create group
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
