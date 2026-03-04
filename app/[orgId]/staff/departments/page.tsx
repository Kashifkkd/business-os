"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
  useDepartmentsList,
  useUpdateDepartment,
  useDeleteDepartment,
} from "@/hooks/use-departments";
import type { Department } from "@/lib/supabase/types";
import { DateDisplay } from "@/components/date-display";
import { isArrayWithValues } from "@/lib/is-array-with-values";
import { Building2 } from "lucide-react";

const columnHelper = createColumnHelper<Department>();

export default function DepartmentsPage() {
  const params = useParams();
  const orgId = params?.orgId as string;

  const { data: departments = [], isLoading } = useDepartmentsList(orgId);
  const updateDept = useUpdateDepartment(orgId);
  const deleteDept = useDeleteDepartment(orgId);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openEdit = (d: Department) => {
    setEditingDept(d);
    setEditName(d.name);
    setEditCode(d.code ?? "");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingDept) return;
    const name = editName.trim();
    if (!name) return;
    try {
      await updateDept.mutateAsync({
        id: editingDept.id,
        name,
        code: editCode.trim() || null,
      });
      setEditDialogOpen(false);
      setEditingDept(null);
    } catch {
      // error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDept.mutateAsync(deleteId);
      setDeleteId(null);
    } catch {
      // error handled by mutation
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (ctx) => (
          <span className="font-medium">{ctx.getValue()}</span>
        ),
      }),
      columnHelper.accessor("code", {
        header: "Code",
        cell: (ctx) => (
          <span className="tabular-nums text-muted-foreground">
            {ctx.getValue() ?? "—"}
          </span>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: "Created at",
        cell: (ctx) => (
          <DateDisplay
            value={ctx.getValue()}
            variant="datetime"
            layout="column"
          />
        ),
      }),
      columnHelper.accessor("updated_at", {
        header: "Updated at",
        cell: (ctx) => (
          <DateDisplay
            value={ctx.getValue()}
            variant="datetime"
            layout="column"
          />
        ),
      }),
      columnHelper.display({
        id: "created_by",
        header: "Created by",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.created_by_name ?? "—"}
          </span>
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
                size="icon"
                className="size-8"
                onClick={() => openEdit(d)}
                aria-label="Edit"
              >
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
    []
  );

  const table = useReactTable({
    data: departments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!orgId) return null;

  const total = departments.length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Departments</h1>
        <p className="text-muted-foreground text-sm">
          Manage departments (e.g. Sales, Kitchen, Operations). Assign employees to departments from the employee form.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            {total === 0
              ? "No departments"
              : `${total} department${total === 1 ? "" : "s"}`}
          </p>
          <Button size="sm" asChild className="gap-1.5">
            <Link href={`/${orgId}/staff/departments/new`}>
              <Plus className="size-3.5" />
              Create
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <TableLoadingSkeleton columnCount={6} rowCount={8} compact />
        ) : isArrayWithValues(departments) ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="bg-muted/50 hover:bg-muted/50"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="h-8 px-3 text-xs">
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
            title="No departments"
            description="Add a department to organize your team (e.g. Sales, Kitchen, HR)."
            icon={Building2}
            action={
              <Button size="sm" asChild className="gap-1.5">
                <Link href={`/${orgId}/staff/departments/new`}>
                  <Plus className="size-3.5" />
                  Create department
                </Link>
              </Button>
            }
          />
        )}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Edit department</DialogTitle>
            <DialogDescription>
              Update the department name and code.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-dept-name">Name</Label>
              <Input
                id="edit-dept-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Sales"
                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dept-code">Code (optional)</Label>
              <Input
                id="edit-dept-code"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                placeholder="e.g. SAL"
                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
              />
            </div>
          </div>
          <DialogFooter showCloseButton={false}>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingDept(null);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={updateDept.isPending || !editName.trim()}
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
            <AlertDialogTitle>Delete department?</AlertDialogTitle>
            <AlertDialogDescription>
              This will only succeed if no employees are assigned to this department. Reassign or remove those employees first.
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
