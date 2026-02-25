"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEmployees, useDeleteEmployee } from "@/hooks/use-employees";
import { useDebounce } from "@/hooks/use-debounce";
import { EmployeesTable } from "./employees-table";
import { SearchBox } from "@/components/search-box";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDepartmentsList } from "@/hooks/use-departments";
import { useDesignationsList } from "@/hooks/use-designations";
import type { Employee } from "@/lib/supabase/types";
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

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

export default function StaffPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const orgId = params?.orgId as string;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const searchFromUrl = searchParams.get("search") ?? "";
  const departmentIdFromUrl = searchParams.get("department_id") ?? "";
  const designationIdFromUrl = searchParams.get("designation_id") ?? "";
  const isActiveFromUrl = searchParams.get("is_active") ?? "";

  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  const setParams = useCallback(
    (updates: {
      page?: number;
      search?: string;
      department_id?: string;
      designation_id?: string;
      is_active?: string;
    }) => {
      const next = new URLSearchParams(searchParams.toString());
      const p = updates.page ?? Math.max(1, Number(searchParams.get("page")) || 1);
      const s = updates.search ?? searchFromUrl;
      const dept = updates.department_id ?? departmentIdFromUrl;
      const desig = updates.designation_id ?? designationIdFromUrl;
      const active = updates.is_active ?? isActiveFromUrl;
      if (p > 1) next.set("page", String(p));
      else next.delete("page");
      if (s) next.set("search", s);
      else next.delete("search");
      if (dept) next.set("department_id", dept);
      else next.delete("department_id");
      if (desig) next.set("designation_id", desig);
      else next.delete("designation_id");
      if (active) next.set("is_active", active);
      else next.delete("is_active");
      const q = next.toString();
      router.push(`${pathname}${q ? `?${q}` : ""}`);
    },
    [pathname, router, searchFromUrl, departmentIdFromUrl, designationIdFromUrl, isActiveFromUrl, searchParams]
  );

  const setParamsRef = useRef(setParams);
  useEffect(() => {
    setParamsRef.current = setParams;
  }, [setParams]);

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed === searchFromUrl.trim()) return;
    setParamsRef.current({ search: trimmed, page: 1 });
  }, [debouncedSearch, searchFromUrl]);

  const page = Math.max(1, Number(searchParams.get("page")) || DEFAULT_PAGE);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE));
  const search = searchParams.get("search") ?? "";
  const department_id = searchParams.get("department_id") ?? "";
  const designation_id = searchParams.get("designation_id") ?? "";
  const is_activeParam = searchParams.get("is_active");
  const is_active =
    is_activeParam === ""
      ? undefined
      : is_activeParam === "true"
        ? true
        : is_activeParam === "false"
          ? false
          : undefined;

  const { data, isLoading, isRefetching } = useEmployees(
    orgId,
    {
      page,
      pageSize,
      search: search.trim() || undefined,
      department_id: department_id.trim() || undefined,
      designation_id: designation_id.trim() || undefined,
      is_active,
    },
    { enabled: !!orgId && mounted }
  );

  const { data: departments = [] } = useDepartmentsList(orgId);
  const { data: designations = [] } = useDesignationsList(orgId);
  const deleteEmployee = useDeleteEmployee(orgId);

  const handleDeleteRequest = useCallback((employee: Employee) => {
    setEmployeeToDelete(employee);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!employeeToDelete) return;
    deleteEmployee.mutate(employeeToDelete.id, {
      onSuccess: () => setEmployeeToDelete(null),
    });
  }, [employeeToDelete, deleteEmployee]);

  if (!orgId) return null;

  const tableData = data ?? {
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Employees</h1>
        <p className="text-muted-foreground text-sm">
          Manage your team: departments, designations, and reporting lines.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBox
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search by name, number, department..."
          className="max-w-xs"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={department_id || "all"}
            onValueChange={(v) => setParams({ department_id: v === "all" ? "" : v, page: 1 })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={designation_id || "all"}
            onValueChange={(v) => setParams({ designation_id: v === "all" ? "" : v, page: 1 })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All designations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All designations</SelectItem>
              {designations.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={is_activeParam ?? "all"}
            onValueChange={(v) => setParams({ is_active: v === "all" ? "" : v, page: 1 })}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <EmployeesTable
        orgId={orgId}
        data={tableData}
        params={{
          page: String(page),
          pageSize: String(pageSize),
          search: search || undefined,
          department_id: department_id || undefined,
          designation_id: designation_id || undefined,
          is_active: is_activeParam ?? undefined,
        }}
        isLoading={isLoading || isRefetching}
        onDelete={handleDeleteRequest}
      />

      <AlertDialog
        open={!!employeeToDelete}
        onOpenChange={(open) => !open && setEmployeeToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the employee record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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
