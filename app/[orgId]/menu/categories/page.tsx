"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { TableLoadingSkeleton } from "@/components/table-loading-skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useMenuCategoriesList,
  useCreateMenuCategory,
  useUpdateMenuCategory,
  useDeleteMenuCategory,
} from "@/hooks/use-menu-categories";
import { useMenuSubcategoriesList } from "@/hooks/use-menu-subcategories";
import type { MenuCategory } from "@/lib/supabase/types";
import { DateDisplay } from "@/components/date-display";
import { isArrayWithValues } from "@/lib/is-array-with-values";
import { Layers } from "lucide-react";

const columnHelper = createColumnHelper<MenuCategory>();

export default function MenuCategoriesPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const { data: categories = [], isLoading } = useMenuCategoriesList(orgId);
  const { data: allSubcategories = [] } = useMenuSubcategoriesList(orgId, { categoryId: undefined });
  const subCountByCategoryId = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of allSubcategories) {
      map.set(s.category_id, (map.get(s.category_id) ?? 0) + 1);
    }
    return map;
  }, [allSubcategories]);
  const createCat = useCreateMenuCategory(orgId);
  const updateCat = useUpdateMenuCategory(orgId);
  const deleteCat = useDeleteMenuCategory(orgId);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await createCat.mutateAsync({ name });
      setNewName("");
      setCreateOpen(false);
    } catch {
      // error handled by mutation
    }
  };

  const startEdit = (c: MenuCategory) => {
    setEditingId(c.id);
    setEditName(c.name);
  };

  const handleSaveEdit = useCallback(async () => {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    try {
      await updateCat.mutateAsync({ id: editingId, name });
      setEditingId(null);
    } catch {
      // error handled by mutation
    }
  }, [editingId, editName, updateCat]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCat.mutateAsync(deleteId);
      setDeleteId(null);
    } catch {
      // error handled by mutation
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (ctx) => {
          const c = ctx.row.original;
          if (editingId === c.id) {
            return (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 w-48"
                />
                <Button size="sm" variant="ghost" onClick={handleSaveEdit} disabled={updateCat.isPending}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
              </div>
            );
          }
          return <span className="font-medium">{ctx.getValue()}</span>;
        },
      }),
      columnHelper.display({
        id: "sub_count",
        header: "Sub-categories",
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {subCountByCategoryId.get(row.original.id) ?? 0}
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
        cell: ({ row }) => {
          const c = row.original;
          if (editingId === c.id) return null;
          return (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="size-8" onClick={() => startEdit(c)} aria-label="Edit">
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={() => setDeleteId(c.id)}
                aria-label="Delete"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          );
        },
      }),
    ],
    [editingId, editName, subCountByCategoryId, updateCat.isPending, handleSaveEdit]
  );

  const table = useReactTable({
    data: categories,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!orgId) return null;

  const total = categories.length;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-2">
        <h1 className="text-md font-semibold">Categories</h1>
        <p className="text-muted-foreground text-xs">
          Manage menu categories (e.g. Coffee, Food). Sub-categories are managed separately.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            {total === 0 ? "No categories" : `Showing ${total} categor${total === 1 ? "y" : "ies"}`}
          </p>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="size-3.5" />
            Create
          </Button>
        </div>

        {isLoading ? (
          <TableLoadingSkeleton columnCount={4} rowCount={8} compact />
        ) : isArrayWithValues(categories) ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="h-8 px-3 text-xs">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="[&_td]:py-1.5 [&_td]:px-3 [&_td]:text-xs">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
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
            title="No categories"
            description="Add a category to organize your menu (e.g. Coffee, Food)."
            icon={Layers}
            action={
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="size-3.5" />
                Create category
              </Button>
            }
          />
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Add category</DialogTitle>
            <DialogDescription>Create a new menu category (e.g. Coffee, Food).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-cat-name">Name</Label>
              <Input
                id="new-cat-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Coffee"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
          </div>
          <DialogFooter showCloseButton={false}>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setNewName(""); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={createCat.isPending || !newName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will only succeed if the category has no sub-categories. Otherwise delete or move sub-categories first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
