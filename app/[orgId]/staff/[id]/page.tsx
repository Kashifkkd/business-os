"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEmployee, useEmployees, useUpdateEmployee, useDeleteEmployee } from "@/hooks/use-employees";
import { useDepartmentsList } from "@/hooks/use-departments";
import { useDesignationsList } from "@/hooks/use-designations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Pencil, Trash2, Save, X } from "lucide-react";
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

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const employeeId = params?.id as string;
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: employee, isLoading } = useEmployee(orgId, employeeId);
  const updateEmployee = useUpdateEmployee(orgId, employeeId);
  const deleteEmployee = useDeleteEmployee(orgId);
  const { data: departments = [] } = useDepartmentsList(orgId);
  const { data: designations = [] } = useDesignationsList(orgId);
  const { data: employeesList } = useEmployeesForReportsTo(orgId, employeeId);

  const [department_id, setDepartmentId] = useState("");
  const [designation_id, setDesignationId] = useState("");
  const [reports_to_id, setReportsToId] = useState<string | null>(null);
  const [employee_number, setEmployeeNumber] = useState("");
  const [join_date, setJoinDate] = useState("");
  const [leave_date, setLeaveDate] = useState("");
  const [is_active, setIsActive] = useState(true);

  const startEditing = () => {
    if (!employee) return;
    setDepartmentId(employee.department_id);
    setDesignationId(employee.designation_id);
    setReportsToId(employee.reports_to_id ?? null);
    setEmployeeNumber(employee.employee_number ?? "");
    setJoinDate(employee.join_date ?? "");
    setLeaveDate(employee.leave_date ?? "");
    setIsActive(employee.is_active);
    setEditing(true);
  };

  const handleSave = () => {
    updateEmployee.mutate(
      {
        department_id,
        designation_id,
        reports_to_id: reports_to_id || null,
        employee_number: employee_number.trim() || null,
        join_date: join_date.trim() || null,
        leave_date: leave_date.trim() || null,
        is_active,
      },
      { onSuccess: () => setEditing(false) }
    );
  };

  const handleDelete = () => {
    deleteEmployee.mutate(employeeId, {
      onSuccess: () => router.push(`/${orgId}/staff`),
      onSettled: () => setDeleteOpen(false),
    });
  };

  if (!orgId || !employeeId) return null;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-xl p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-40 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="container mx-auto max-w-xl p-4">
        <p className="text-destructive text-sm">Employee not found.</p>
        <Button variant="link" asChild className="mt-2 p-0">
          <Link href={`/${orgId}/staff`}>Back to employees</Link>
        </Button>
      </div>
    );
  }

  const displayName = employee.display_name ?? employee.employee_number ?? "Employee";

  return (
    <div className="container mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${orgId}/staff`}>
            <ArrowLeft className="size-4" />
            Back to employees
          </Link>
        </Button>
        {!editing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil className="size-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
              disabled={deleteEmployee.isPending}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={updateEmployee.isPending}>
              <Save className="size-4" />
              {updateEmployee.isPending ? "Saving…" : "Save"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              <X className="size-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">{displayName}</h1>
            <span
              className={`text-xs font-medium ${employee.is_active ? "text-green-600" : "text-muted-foreground"}`}
            >
              {employee.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          {(employee.employee_number || employee.department_name || employee.designation_name) && (
            <p className="text-muted-foreground text-sm">
              {[employee.employee_number, employee.department_name, employee.designation_name]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select value={department_id} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Designation *</Label>
                <Select value={designation_id} onValueChange={setDesignationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    {designations.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reports to</Label>
                <Select
                  value={reports_to_id ?? "none"}
                  onValueChange={(v) => setReportsToId(v === "none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {employeesList?.map((e) => (
                      <SelectItem key={e.id} value={e.id} disabled={e.id === employeeId}>
                        {e.display_name ?? e.employee_number ?? e.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_number">Employee number</Label>
                <Input
                  id="employee_number"
                  value={employee_number}
                  onChange={(e) => setEmployeeNumber(e.target.value)}
                  placeholder="e.g. EMP-001"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="join_date">Join date</Label>
                  <Input
                    id="join_date"
                    type="date"
                    value={join_date}
                    onChange={(e) => setJoinDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leave_date">Leave date</Label>
                  <Input
                    id="leave_date"
                    type="date"
                    value={leave_date}
                    onChange={(e) => setLeaveDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="is_active" checked={is_active} onCheckedChange={setIsActive} />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </>
          ) : (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Department</dt>
                <dd>{employee.department_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Designation</dt>
                <dd>{employee.designation_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Reports to</dt>
                <dd>{employee.reports_to_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Employee number</dt>
                <dd>{employee.employee_number ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Join date</dt>
                <dd>{employee.join_date ? new Date(employee.join_date).toLocaleDateString() : "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Leave date</dt>
                <dd>{employee.leave_date ? new Date(employee.leave_date).toLocaleDateString() : "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd>{new Date(employee.created_at).toLocaleString()}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this employee record. This action cannot be undone.
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

function useEmployeesForReportsTo(orgId: string | undefined, excludeId: string) {
  const { data } = useEmployees(orgId, { page: 1, pageSize: 500 }, { enabled: !!orgId });
  if (!data?.items) return { data: undefined };
  return { data: data.items.filter((e) => e.id !== excludeId) };
}
