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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useDesignationsList,
  useUpdateDesignation,
  useDeleteDesignation,
} from "@/hooks/use-designations";
import { useDepartmentsList } from "@/hooks/use-departments";
import type { Designation } from "@/lib/supabase/types";
import { DateDisplay } from "@/components/date-display";
import { isArrayWithValues } from "@/lib/is-array-with-values";
import { Briefcase } from "lucide-react";

const columnHelper = createColumnHelper<Designation>();

export default function DesignationsPage() {
  const params = useParams();
  const orgId = params?.orgId as string;

  const { data: designations = [], isLoading } = useDesignationsList(orgId);
  const { data: departments = [] } = useDepartmentsList(orgId);
  const updateDesig = useUpdateDesignation(orgId);
  const deleteDesig = useDeleteDesignation(orgId);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDesig, setEditingDesig] = useState<Designation | null>(null);
  const [editName, setEditName] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const departmentById = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of departments) m.set(d.id, d.name);
    return m;
  }, [departments]);

  const openEdit = (d: Designation) => {
    setEditingDesig(d);
    setEditName(d.name);
    setEditDepartmentId(d.department_id ?? null);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingDesig) return;
    const name = editName.trim();
    if (!name) return;
    try {
      await updateDesig.mutateAsync({
        id: editingDesig.id,
        name,
        department_id: editDepartmentId || null,
      });
      setEditDialogOpen(false);
      setEditingDesig(null);
    } catch {
      // error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDesig.mutateAsync(deleteId);
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
      columnHelper.accessor("department_id", {
        header: "Department",
        cell: (ctx) => {
          const d = ctx.row.original;
          const name = d.department_id ? departmentById.get(d.department_id) : null;
          return (
            <span className="text-muted-foreground">{name ?? "—"}</span>
          );
        },
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
    [departmentById]
  );

  const table = useReactTable({
    data: designations,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!orgId) return null;

  const total = designations.length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Designations</h1>
        <p className="text-muted-foreground text-sm">
          Manage job titles (e.g. Manager, Barista, Sales Associate). Designations can be org-wide or department-specific.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            {total === 0
              ? "No designations"
              : `${total} designation${total === 1 ? "" : "s"}`}
          </p>
          <Button size="sm" asChild className="gap-1.5">
            <Link href={`/${orgId}/staff/designations/new`}>
              <Plus className="size-3.5" />
              Create
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <TableLoadingSkeleton columnCount={6} rowCount={8} compact />
        ) : isArrayWithValues(designations) ? (
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
            title="No designations"
            description="Add a job title to assign to employees (e.g. Manager, Barista, Sales Associate)."
            icon={Briefcase}
            action={
              <Button size="sm" asChild className="gap-1.5">
                <Link href={`/${orgId}/staff/designations/new`}>
                  <Plus className="size-3.5" />
                  Create designation
                </Link>
              </Button>
            }
          />
        )}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Edit designation</DialogTitle>
            <DialogDescription>
              Update the job title and optional department.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-desig-name">Name</Label>
              <Input
                id="edit-desig-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Manager"
                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
              />
            </div>
            <div className="space-y-2">
              <Label>Department (optional)</Label>
              <Select
                value={editDepartmentId ?? "none"}
                onValueChange={(v) => setEditDepartmentId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— All departments —</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter showCloseButton={false}>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingDesig(null);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={updateDesig.isPending || !editName.trim()}
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
            <AlertDialogTitle>Delete designation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will only succeed if no employees use this designation. Reassign those employees first.
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
