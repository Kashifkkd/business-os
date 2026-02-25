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
  useDepartmentsList,
  useCreateDepartment,
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
  const createDept = useCreateDepartment(orgId);
  const updateDept = useUpdateDepartment(orgId);
  const deleteDept = useDeleteDepartment(orgId);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await createDept.mutateAsync({ name, code: newCode.trim() || null });
      setNewName("");
      setNewCode("");
      setCreateOpen(false);
    } catch {
      // error handled by mutation
    }
  };

  const startEdit = (d: Department) => {
    setEditingId(d.id);
    setEditName(d.name);
    setEditCode(d.code ?? "");
  };

  const handleSaveEdit = useCallback(async () => {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    try {
      await updateDept.mutateAsync({
        id: editingId,
        name,
        code: editCode.trim() || null,
      });
      setEditingId(null);
    } catch {
      // error handled by mutation
    }
  }, [editingId, editName, editCode, updateDept]);

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
        cell: (ctx) => {
          const d = ctx.row.original;
          if (editingId === d.id) {
            return (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 w-48"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveEdit}
                  disabled={updateDept.isPending}
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
      columnHelper.accessor("code", {
        header: "Code",
        cell: (ctx) => {
          const d = ctx.row.original;
          if (editingId === d.id) {
            return (
              <Input
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                className="h-8 w-24"
                placeholder="e.g. SAL"
              />
            );
          }
          return (
            <span className="tabular-nums text-muted-foreground">
              {ctx.getValue() ?? "—"}
            </span>
          );
        },
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
          const d = row.original;
          if (editingId === d.id) return null;
          return (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => startEdit(d)}
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
    [editingId, editName, editCode, updateDept.isPending, handleSaveEdit]
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
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="size-3.5" />
            Create
          </Button>
        </div>

        {isLoading ? (
          <TableLoadingSkeleton columnCount={4} rowCount={8} compact />
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
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="size-3.5" />
                Create department
              </Button>
            }
          />
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Add department</DialogTitle>
            <DialogDescription>
              Create a new department (e.g. Sales, Kitchen, Operations).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-dept-name">Name</Label>
              <Input
                id="new-dept-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Sales"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-dept-code">Code (optional)</Label>
              <Input
                id="new-dept-code"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="e.g. SAL"
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
                setNewCode("");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={createDept.isPending || !newName.trim()}
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
