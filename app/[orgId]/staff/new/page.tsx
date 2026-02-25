"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateEmployee, useEmployees } from "@/hooks/use-employees";
import { useDepartmentsList } from "@/hooks/use-departments";
import { useDesignationsList } from "@/hooks/use-designations";
import { useOrganization } from "@/hooks/use-organization";
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
import { ArrowLeft } from "lucide-react";

export default function NewEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;

  const [department_id, setDepartmentId] = useState("");
  const [designation_id, setDesignationId] = useState("");
  const [profile_id, setProfileId] = useState<string | null>(null);
  const [reports_to_id, setReportsToId] = useState<string | null>(null);
  const [employee_number, setEmployeeNumber] = useState("");
  const [join_date, setJoinDate] = useState("");
  const [leave_date, setLeaveDate] = useState("");
  const [is_active, setIsActive] = useState(true);

  const createEmployee = useCreateEmployee(orgId);
  const { data: departments = [] } = useDepartmentsList(orgId);
  const { data: designations = [] } = useDesignationsList(orgId);
  const { orgMembers = [] } = useOrganization(orgId);
  const { data: employeesList } = useEmployeesForReportsTo(orgId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!department_id.trim() || !designation_id.trim()) return;
    createEmployee.mutate(
      {
        department_id: department_id.trim(),
        designation_id: designation_id.trim(),
        profile_id: profile_id || null,
        reports_to_id: reports_to_id || null,
        employee_number: employee_number.trim() || null,
        join_date: join_date.trim() || null,
        leave_date: leave_date.trim() || null,
        is_active,
      },
      {
        onSuccess: (data) => router.push(`/${orgId}/staff/${data.id}`),
        onError: () => {},
      }
    );
  };

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-xl space-y-4">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${orgId}/staff`}>
            <ArrowLeft className="size-4" />
            Back to employees
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <h1 className="text-lg font-semibold">Add employee</h1>
          <p className="text-muted-foreground text-sm">
            Create a new employee record. Link to a user account (optional) to show name from profile.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Link to user (optional)</Label>
              <Select
                value={profile_id ?? "none"}
                onValueChange={(v) => setProfileId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {orgMembers.map((m) => {
                    const name = [m.first_name, m.last_name].filter(Boolean).join(" ").trim() || m.email ?? m.user_id;
                    return (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                If linked, the employee name will come from the user profile.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select value={department_id} onValueChange={setDepartmentId} required>
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
              <Select value={designation_id} onValueChange={setDesignationId} required>
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
                    <SelectItem key={e.id} value={e.id}>
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
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={createEmployee.isPending || !department_id.trim() || !designation_id.trim()}
              >
                {createEmployee.isPending ? "Creating…" : "Create employee"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/${orgId}/staff`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function useEmployeesForReportsTo(orgId: string | undefined) {
  const { data } = useEmployees(orgId, { page: 1, pageSize: 500 }, { enabled: !!orgId });
  return { data: data?.items };
}
