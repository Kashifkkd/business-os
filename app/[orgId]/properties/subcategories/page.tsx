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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { usePropertyCategoriesList } from "@/hooks/use-property-categories";
import {
  usePropertySubcategoriesList,
  useCreatePropertySubcategory,
  useUpdatePropertySubcategory,
  useDeletePropertySubcategory,
} from "@/hooks/use-property-subcategories";
import type { PropertySubCategoryWithCategory } from "@/hooks/use-property-subcategories";
import { DateDisplay } from "@/components/date-display";
import { isArrayWithValues } from "@/lib/is-array-with-values";
import { Layers } from "lucide-react";

const columnHelper =
  createColumnHelper<PropertySubCategoryWithCategory>();

export default function PropertySubcategoriesPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const { data: categories = [] } = usePropertyCategoriesList(orgId);
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const { data: subcategories = [], isLoading } = usePropertySubcategoriesList(
    orgId,
    { categoryId: filterCategoryId || undefined }
  );
  const createSub = useCreatePropertySubcategory(orgId);
  const updateSub = useUpdatePropertySubcategory(orgId);
  const deleteSub = useDeletePropertySubcategory(orgId);

  const [createOpen, setCreateOpen] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = async () => {
    const category_id = newCategoryId || categories[0]?.id;
    const name = newName.trim();
    if (!category_id || !name) return;
    try {
      await createSub.mutateAsync({ category_id, name });
      setNewName("");
      setNewCategoryId("");
      setCreateOpen(false);
    } catch {
      // error handled by mutation
    }
  };

  const startEdit = (s: PropertySubCategoryWithCategory) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditCategoryId(s.category_id);
  };

  const handleSaveEdit = useCallback(async () => {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    try {
      await updateSub.mutateAsync({
        id: editingId,
        name,
        category_id: editCategoryId,
      });
      setEditingId(null);
    } catch {
      // error handled by mutation
    }
  }, [editingId, editName, editCategoryId, updateSub]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteSub.mutateAsync(deleteId);
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
          const s = ctx.row.original;
          if (editingId === s.id) {
            return (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 w-48"
                />
                <Select
                  value={editCategoryId}
                  onValueChange={setEditCategoryId}
                >
                  <SelectTrigger className="h-8 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isArrayWithValues(categories) && categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveEdit}
                  disabled={updateSub.isPending}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </Button>
              </div>
            );
          }
          return <span className="font-medium">{ctx.getValue()}</span>;
        },
      }),
      columnHelper.accessor("category_name", {
        header: "Category",
        cell: (ctx) => (
          <span className="text-muted-foreground">
            {ctx.getValue() ?? "—"}
          </span>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: "Created",
        cell: (ctx) => (
          <DateDisplay
            value={ctx.getValue()}
            variant="timeAgo"
            layout="column"
          />
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const s = row.original;
          if (editingId === s.id) return null;
          return (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => startEdit(s)}
                aria-label="Edit"
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={() => setDeleteId(s.id)}
                aria-label="Delete"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          );
        },
      }),
    ],
    [
      editingId,
      editName,
      editCategoryId,
      categories,
      handleSaveEdit,
      updateSub.isPending,
    ]
  );

  const table = useReactTable({
    data: subcategories,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!orgId) return null;

  const total = isArrayWithValues(subcategories) ? subcategories.length : 0;
  const hasCategories = isArrayWithValues(categories) && categories.length > 0;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-2">
        <h1 className="text-md font-semibold">Sub-categories</h1>
        <p className="text-muted-foreground text-xs">
          Manage sub-categories under each category (e.g. Apartment under
          Residential).
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            {total === 0
              ? "No sub-categories"
              : `Showing ${total} sub-categor${total === 1 ? "y" : "ies"}`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filterCategoryId || "all"}
              onValueChange={(v) =>
                setFilterCategoryId(v === "all" ? "" : v)
              }
            >
              <SelectTrigger className="h-8 w-40">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {isArrayWithValues(categories) && categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="gap-1.5"
              disabled={!hasCategories}
            >
              <Plus className="size-3.5" />
              Create
            </Button>
          </div>
        </div>

        {!hasCategories ? (
          <EmptyState
            title="Create categories first"
            description="Add property categories (e.g. Residential, Commercial), then add sub-categories here."
            icon={Layers}
          />
        ) : isLoading ? (
          <TableLoadingSkeleton columnCount={4} rowCount={8} compact />
        ) : isArrayWithValues(subcategories) ? (
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
            title={
              filterCategoryId
                ? "No sub-categories in this category"
                : "No sub-categories"
            }
            description="Add a sub-category to organize properties (e.g. Apartment under Residential)."
            icon={Layers}
            action={
              <Button
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="gap-1.5"
              >
                <Plus className="size-3.5" />
                Create sub-category
              </Button>
            }
          />
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Add sub-category</DialogTitle>
            <DialogDescription>
              Create a new sub-category under a category (e.g. Apartment under
              Residential).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newCategoryId || categories[0]?.id}
                onValueChange={setNewCategoryId}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {isArrayWithValues(categories) && categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-sub-name">Name</Label>
              <Input
                id="new-sub-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Apartment"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
          </div>
          <DialogFooter showCloseButton={false}>
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                setNewName("");
                setNewCategoryId("");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={createSub.isPending || !newName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sub-category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will only succeed if no properties use this sub-category.
              Change or remove those properties first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
