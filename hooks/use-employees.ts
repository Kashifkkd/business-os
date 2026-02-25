"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Employee } from "@/lib/supabase/types";
import { queryKeys, fetcherData, API } from "@/hooks/use-api";

export interface GetEmployeesResult {
  items: Employee[];
  total: number;
  page: number;
  pageSize: number;
}

export type CreateEmployeePayload = {
  profile_id?: string | null;
  department_id: string;
  designation_id: string;
  reports_to_id?: string | null;
  employee_number?: string | null;
  join_date?: string | null;
  leave_date?: string | null;
  is_active?: boolean;
};

export type UpdateEmployeePayload = Partial<{
  profile_id: string | null;
  department_id: string;
  designation_id: string;
  reports_to_id: string | null;
  employee_number: string | null;
  join_date: string | null;
  leave_date: string | null;
  is_active: boolean;
}>;

export function useEmployees(
  orgId: string | undefined,
  params: {
    page: number;
    pageSize: number;
    search?: string;
    department_id?: string;
    designation_id?: string;
    is_active?: boolean;
  },
  options?: Omit<UseQueryOptions<GetEmployeesResult>, "queryKey" | "queryFn">
) {
  const { page, pageSize, search, department_id, designation_id, is_active } = params;
  return useQuery({
    queryKey: queryKeys.employees(orgId ?? "", {
      page,
      pageSize,
      search,
      department_id,
      designation_id,
      is_active,
    }),
    queryFn: () => {
      if (!orgId)
        return Promise.resolve({ items: [], total: 0, page: 1, pageSize: 10 });
      const sp = new URLSearchParams();
      if (page > 1) sp.set("page", String(page));
      if (pageSize !== 10) sp.set("pageSize", String(pageSize));
      if (search) sp.set("search", search);
      if (department_id) sp.set("department_id", department_id);
      if (designation_id) sp.set("designation_id", designation_id);
      if (typeof is_active === "boolean") sp.set("is_active", String(is_active));
      const q = sp.toString();
      return fetcherData<GetEmployeesResult>(
        `${API}/orgs/${orgId}/employees${q ? `?${q}` : ""}`
      );
    },
    enabled: !!orgId,
    ...options,
  });
}

export function useEmployee(
  orgId: string | undefined,
  employeeId: string | undefined,
  options?: Omit<UseQueryOptions<Employee | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.employee(orgId ?? "", employeeId ?? ""),
    queryFn: () =>
      orgId && employeeId
        ? fetcherData<Employee>(
            `${API}/orgs/${orgId}/employees/${employeeId}`
          ).catch(() => null)
        : Promise.resolve(null),
    enabled: !!orgId && !!employeeId,
    ...options,
  });
}

export function useCreateEmployee(
  orgId: string,
  options?: UseMutationOptions<Employee, Error, CreateEmployeePayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEmployeePayload) =>
      fetcherData<Employee>(`${API}/orgs/${orgId}/employees`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "employees"] });
    },
    ...options,
  });
}

export function useUpdateEmployee(
  orgId: string,
  employeeId: string,
  options?: UseMutationOptions<Employee, Error, UpdateEmployeePayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateEmployeePayload) =>
      fetcherData<Employee>(`${API}/orgs/${orgId}/employees/${employeeId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.employee(orgId, employeeId), data);
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "employees"] });
    },
    ...options,
  });
}

export function useDeleteEmployee(
  orgId: string,
  options?: UseMutationOptions<{ deleted: true }, Error, string>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: string) =>
      fetcherData<{ deleted: true }>(
        `${API}/orgs/${orgId}/employees/${employeeId}`,
        { method: "DELETE" }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgId, "employees"] });
    },
    ...options,
  });
}
