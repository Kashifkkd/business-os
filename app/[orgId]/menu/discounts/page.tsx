"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { Pencil, Trash2, Plus, Tag } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
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
  useMenuDiscounts,
  useCreateDiscount,
  useUpdateDiscount,
  useDeleteDiscount,
} from "@/hooks/use-menu-discounts";
import type { MenuDiscount } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { isArrayWithValues } from "@/lib/is-array-with-values";

const columnHelper = createColumnHelper<MenuDiscount>();

export default function MenuDiscountsPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const { data: discounts = [], isLoading } = useMenuDiscounts(orgId);
  const createDiscount = useCreateDiscount(orgId);
  const updateDiscount = useUpdateDiscount(orgId);
  const deleteDiscount = useDeleteDiscount(orgId);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<MenuDiscount | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"percentage" | "fixed">("percentage");
  const [formValue, setFormValue] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formDescription, setFormDescription] = useState("");

  const resetForm = () => {
    setFormName("");
    setFormType("percentage");
    setFormValue("");
    setFormIsActive(true);
    setFormDescription("");
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (d: MenuDiscount) => {
    setEditing(d);
    setFormName(d.name);
    setFormType(d.type);
    setFormValue(String(d.value));
    setFormIsActive(d.is_active);
    setFormDescription(d.description ?? "");
    setEditOpen(true);
  };

  const handleCreate = async () => {
    const name = formName.trim();
    if (!name) return;
    const value = parseFloat(formValue);
    if (Number.isNaN(value) || value < 0) return;
    try {
      await createDiscount.mutateAsync({
        name,
        type: formType,
        value,
        is_active: formIsActive,
        description: formDescription.trim() || null,
      });
      resetForm();
      setCreateOpen(false);
    } catch {
      // error handled by mutation
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    const name = formName.trim();
    if (!name) return;
    const value = parseFloat(formValue);
    if (Number.isNaN(value) || value < 0) return;
    try {
      await updateDiscount.mutateAsync({
        id: editing.id,
        name,
        type: formType,
        value,
        is_active: formIsActive,
        description: formDescription.trim() || null,
      });
      resetForm();
      setEditOpen(false);
    } catch {
      // error handled by mutation
    }
  };

  const handleToggleActive = useCallback(async (d: MenuDiscount) => {
    try {
      await updateDiscount.mutateAsync({ id: d.id, is_active: !d.is_active });
    } catch {
      // error handled by mutation
    }
  }, [updateDiscount]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDiscount.mutateAsync(deleteId);
      setDeleteId(null);
    } catch {
      // error handled by mutation
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (ctx) => <span className="font-medium">{ctx.getValue()}</span>,
      }),
      columnHelper.accessor("type", {
        header: "Type",
        cell: (ctx) => <span className="capitalize">{ctx.getValue()}</span>,
      }),
      columnHelper.accessor("value", {
        header: () => <span className="text-right">Value</span>,
        cell: (ctx) => {
          const row = ctx.row.original;
          return (
            <span className="tabular-nums text-right">
              {row.type === "percentage" ? `${row.value}%` : row.value}
            </span>
          );
        },
      }),
      columnHelper.accessor("is_active", {
        header: "Status",
        cell: (ctx) => (
          <Badge
            variant={ctx.getValue() ? "default" : "secondary"}
            className={cn("text-[10px] font-normal", !ctx.getValue() && "opacity-70")}
          >
            {ctx.getValue() ? "Active" : "Inactive"}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleToggleActive(d)}
                disabled={updateDiscount.isPending}
              >
                {d.is_active ? "Deactivate" : "Activate"}
              </Button>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(d)} aria-label="Edit">
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={() => setDeleteId(d.id)}
                aria-label="Delete"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          );
        },
      }),
    ],
    [handleToggleActive, updateDiscount.isPending]
  );

  const table = useReactTable({
    data: discounts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!orgId) return null;

  const total = discounts.length;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-2">
        <h1 className="text-md font-semibold">Discounts</h1>
        <p className="text-muted-foreground text-xs">
          Manage percentage or fixed discounts for pricing. Used when creating menu items; not stored on items.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            {total === 0 ? "No discounts" : `Showing ${total} discount${total === 1 ? "" : "s"}`}
          </p>
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="size-3.5" />
            Create
          </Button>
        </div>

        {isLoading ? (
          <TableLoadingSkeleton columnCount={5} rowCount={8} compact />
        ) : isArrayWithValues(discounts) ? (
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
            title="No discounts"
            description="Create percentage or fixed discounts to use when pricing menu items."
            icon={Tag}
            action={
              <Button size="sm" onClick={openCreate} className="gap-1.5">
                <Plus className="size-3.5" />
                Create discount
              </Button>
            }
          />
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Add discount</DialogTitle>
            <DialogDescription>Create a percentage or fixed discount for use when pricing menu items.</DialogDescription>
          </DialogHeader>
          <DiscountFormFields
            name={formName}
            onNameChange={setFormName}
            type={formType}
            onTypeChange={setFormType}
            value={formValue}
            onValueChange={setFormValue}
            isActive={formIsActive}
            onIsActiveChange={setFormIsActive}
            description={formDescription}
            onDescriptionChange={setFormDescription}
          />
          <DialogFooter showCloseButton={false}>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={
                createDiscount.isPending ||
                !formName.trim() ||
                Number.isNaN(parseFloat(formValue)) ||
                parseFloat(formValue) < 0
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Edit discount</DialogTitle>
            <DialogDescription>Update name, type, value, or status.</DialogDescription>
          </DialogHeader>
          <DiscountFormFields
            name={formName}
            onNameChange={setFormName}
            type={formType}
            onTypeChange={setFormType}
            value={formValue}
            onValueChange={setFormValue}
            isActive={formIsActive}
            onIsActiveChange={setFormIsActive}
            description={formDescription}
            onDescriptionChange={setFormDescription}
          />
          <DialogFooter showCloseButton={false}>
            <Button variant="outline" onClick={() => { setEditOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUpdate}
              disabled={
                updateDiscount.isPending ||
                !formName.trim() ||
                Number.isNaN(parseFloat(formValue)) ||
                parseFloat(formValue) < 0
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete discount?</AlertDialogTitle>
            <AlertDialogDescription>
              This discount will be removed. Menu items do not store discount IDs; only their computed prices are saved.
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

function DiscountFormFields({
  name,
  onNameChange,
  type,
  onTypeChange,
  value,
  onValueChange,
  isActive,
  onIsActiveChange,
  description,
  onDescriptionChange,
}: {
  name: string;
  onNameChange: (v: string) => void;
  type: "percentage" | "fixed";
  onTypeChange: (v: "percentage" | "fixed") => void;
  value: string;
  onValueChange: (v: string) => void;
  isActive: boolean;
  onIsActiveChange: (v: boolean) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="disc-name">Name</Label>
        <Input
          id="disc-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. 10% Off"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => onTypeChange(v as "percentage" | "fixed")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="disc-value">{type === "percentage" ? "Value (%)" : "Value (amount)"}</Label>
          <Input
            id="disc-value"
            type="number"
            min={0}
            step={type === "percentage" ? 1 : 0.01}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={type === "percentage" ? "10" : "1.00"}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="disc-active"
          checked={isActive}
          onChange={(e) => onIsActiveChange(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="disc-active" className="font-normal cursor-pointer">
          Active (shown in menu form)
        </Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="disc-desc">Description (optional)</Label>
        <Textarea
          id="disc-desc"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="e.g. Weekend special"
          rows={2}
          className="resize-none"
        />
      </div>
    </div>
  );
}
