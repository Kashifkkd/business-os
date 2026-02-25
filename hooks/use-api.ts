"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Profile } from "@/lib/supabase/types";
import type { ApiResponse } from "@/lib/api-response";
import { getDataOrThrow } from "@/lib/api-response";

export const API = "/api";

/** Fetch and return the raw API response as defined (success, data, total?, error?). No unwrapping. */
export async function fetcher<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const json = await res.json().catch(() => ({ success: false, error: { code: "INTERNAL_ERROR", message: res.statusText || "Request failed" } }));
  return json as ApiResponse<T>;
}

/** Fetch and return data; throws on success: false or error. Use in hooks when you need T. */
export async function fetcherData<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetcher<T>(url, init);
  return getDataOrThrow(response);
}

/** Shared query keys for all domain hooks (org, menu, cafe). */
export const queryKeys = {
  profile: () => ["me", "profile"] as const,
  orgs: () => ["orgs"] as const,
  org: (orgId: string) => ["orgs", orgId] as const,
  orgMembers: (orgId: string) => ["orgs", orgId, "members"] as const,
  menuCategories: (orgId: string) => ["orgs", orgId, "menu-items", "categories"] as const,
  menuItem: (orgId: string, itemId: string) => ["orgs", orgId, "menu-items", itemId] as const,
  menuItems: (orgId: string, params: { page: number; pageSize: number; search?: string }) =>
    ["orgs", orgId, "menu-items", params.page, params.pageSize, params.search ?? ""] as const,
  menuCategoriesList: (orgId: string) => ["orgs", orgId, "menu-categories"] as const,
  menuSubcategoriesList: (orgId: string, categoryId?: string) =>
    ["orgs", orgId, "menu-subcategories", categoryId ?? ""] as const,
  menuDiscounts: (orgId: string) => ["orgs", orgId, "menu-discounts"] as const,
  cafeDashboard: (orgId: string) => ["orgs", orgId, "cafe", "dashboard"] as const,
  cafeInsights: (orgId: string) => ["orgs", orgId, "cafe", "insights"] as const,
  properties: (orgId: string, params: { page: number; pageSize: number; search?: string }) =>
    ["orgs", orgId, "properties", params.page, params.pageSize, params.search ?? ""] as const,
  property: (orgId: string, propertyId: string) => ["orgs", orgId, "properties", propertyId] as const,
  propertyCategoriesList: (orgId: string) =>
    ["orgs", orgId, "property-categories"] as const,
  propertySubcategoriesList: (orgId: string, categoryId?: string) =>
    ["orgs", orgId, "property-subcategories", categoryId ?? ""] as const,
  leads: (
    orgId: string,
    params: {
      page: number;
      pageSize: number;
      search?: string;
      status?: string;
      source?: string;
      created_after?: string;
      created_before?: string;
      sortBy?: string;
      order?: string;
    }
  ) =>
    [
      "orgs",
      orgId,
      "leads",
      params.page,
      params.pageSize,
      params.search ?? "",
      params.status ?? "",
      params.source ?? "",
      params.created_after ?? "",
      params.created_before ?? "",
      params.sortBy ?? "created_at",
      params.order ?? "desc",
    ] as const,
  lead: (orgId: string, leadId: string) => ["orgs", orgId, "leads", leadId] as const,
  leadActivities: (orgId: string, leadId: string) => ["orgs", orgId, "leads", leadId, "activities"] as const,
  leadSources: (orgId: string) => ["orgs", orgId, "leads", "sources"] as const,
  leadStats: (orgId: string) => ["orgs", orgId, "leads", "stats"] as const,
  listings: (orgId: string, params: { page: number; pageSize: number; status?: string }) =>
    ["orgs", orgId, "listings", params.page, params.pageSize, params.status ?? ""] as const,
  listing: (orgId: string, listingId: string) => ["orgs", orgId, "listings", listingId] as const,
  employees: (
    orgId: string,
    params: { page: number; pageSize: number; search?: string; department_id?: string; designation_id?: string; is_active?: boolean }
  ) =>
    [
      "orgs",
      orgId,
      "employees",
      params.page,
      params.pageSize,
      params.search ?? "",
      params.department_id ?? "",
      params.designation_id ?? "",
      params.is_active ?? "",
    ] as const,
  employee: (orgId: string, employeeId: string) => ["orgs", orgId, "employees", employeeId] as const,
  departmentsList: (orgId: string) => ["orgs", orgId, "departments"] as const,
  department: (orgId: string, departmentId: string) => ["orgs", orgId, "departments", departmentId] as const,
  designationsList: (orgId: string, departmentId?: string) =>
    ["orgs", orgId, "designations", departmentId ?? ""] as const,
  designation: (orgId: string, designationId: string) => ["orgs", orgId, "designations", designationId] as const,
  // Tasks module
  spaces: (orgId: string) => ["orgs", orgId, "spaces"] as const,
  space: (orgId: string, spaceId: string) => ["orgs", orgId, "spaces", spaceId] as const,
  spaceLists: (orgId: string, spaceId: string) => ["orgs", orgId, "spaces", spaceId, "lists"] as const,
  spaceStatuses: (orgId: string, spaceId: string) => ["orgs", orgId, "spaces", spaceId, "statuses"] as const,
  tasks: (
    orgId: string,
    params: {
      space_id: string;
      list_id?: string;
      status_id?: string;
      assignee_id?: string;
      parent_id?: string;
      search?: string;
      sortBy?: string;
      order?: string;
      page: number;
      pageSize: number;
    }
  ) =>
    [
      "orgs",
      orgId,
      "tasks",
      params.space_id,
      params.list_id ?? "",
      params.status_id ?? "",
      params.assignee_id ?? "",
      params.parent_id ?? "",
      params.search ?? "",
      params.sortBy ?? "sort_order",
      params.order ?? "desc",
      params.page,
      params.pageSize,
    ] as const,
  task: (orgId: string, taskId: string) => ["orgs", orgId, "tasks", taskId] as const,
  taskComments: (orgId: string, taskId: string) => ["orgs", orgId, "tasks", taskId, "comments"] as const,
  taskActivities: (orgId: string, taskId: string) => ["orgs", orgId, "tasks", taskId, "activities"] as const,
};

// ——— Profile (auth / me) ———

/** Current user profile. */
export function useProfile(
  options?: Omit<UseQueryOptions<Profile | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.profile(),
    queryFn: () => fetcherData<Profile | null>(`${API}/me/profile`).catch(() => null),
    ...options,
  });
}

/** Update profile. Invalidates profile query. */
export function useUpdateProfile(
  options?: UseMutationOptions<Profile, Error, Partial<Profile>>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Profile>) =>
      fetcherData<Profile>(`${API}/me/profile`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.profile(), data);
    },
    ...options,
  });
}
