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

type LogsQueryKeyParams = {
  from?: string;
  to?: string;
  action?: string;
  entity_type?: string;
  user_id?: string;
  limit?: number;
};

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
      stage?: string;
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
      params.stage ?? "",
      params.source ?? "",
      params.created_after ?? "",
      params.created_before ?? "",
      params.sortBy ?? "created_at",
      params.order ?? "desc",
    ] as const,
  lead: (orgId: string, leadId: string) => ["orgs", orgId, "leads", leadId] as const,
  companies: (orgId: string) => ["orgs", orgId, "companies"] as const,
  leadActivities: (orgId: string, leadId: string) => ["orgs", orgId, "leads", leadId, "activities"] as const,
  leadSources: (orgId: string) => ["orgs", orgId, "leads", "sources"] as const,
  leadStages: (orgId: string) => ["orgs", orgId, "leads", "stages"] as const,
  leadStats: (orgId: string) => ["orgs", orgId, "leads", "stats"] as const,
  logs: (orgId: string, params: LogsQueryKeyParams) =>
    [
      "orgs",
      orgId,
      "logs",
      params.from ?? "",
      params.to ?? "",
      params.action ?? "",
      params.entity_type ?? "",
      params.user_id ?? "",
      params.limit ?? 20,
    ] as const,
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
  spaceLabels: (orgId: string, spaceId: string) => ["orgs", orgId, "spaces", spaceId, "labels"] as const,
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
  // Inventory module
  inventoryItems: (orgId: string, params: { page: number; pageSize: number; search?: string }) =>
    ["orgs", orgId, "inventory", "items", params.page, params.pageSize, params.search ?? ""] as const,
  inventoryItem: (orgId: string, itemId: string) => ["orgs", orgId, "inventory", "items", itemId] as const,
  inventoryItemGroups: (orgId: string) => ["orgs", orgId, "inventory", "item-groups"] as const,
  inventoryItemGroup: (orgId: string, groupId: string) => ["orgs", orgId, "inventory", "item-groups", groupId] as const,
  warehouses: (orgId: string) => ["orgs", orgId, "inventory", "warehouses"] as const,
  warehouse: (orgId: string, warehouseId: string) => ["orgs", orgId, "inventory", "warehouses", warehouseId] as const,
  vendors: (orgId: string) => ["orgs", orgId, "inventory", "vendors"] as const,
  vendor: (orgId: string, vendorId: string) => ["orgs", orgId, "inventory", "vendors", vendorId] as const,
  inventoryAnalytics: (orgId: string) => ["orgs", orgId, "inventory", "analytics"] as const,
  purchaseOrders: (orgId: string, params: { page: number; pageSize: number; search?: string; status?: string }) =>
    ["orgs", orgId, "inventory", "purchase-orders", params.page, params.pageSize, params.search ?? "", params.status ?? ""] as const,
  purchaseOrder: (orgId: string, poId: string) => ["orgs", orgId, "inventory", "purchase-orders", poId] as const,
  inventoryBills: (orgId: string, params: { page: number; pageSize: number; search?: string; status?: string }) =>
    ["orgs", orgId, "inventory", "bills", params.page, params.pageSize, params.search ?? "", params.status ?? ""] as const,
  inventoryBill: (orgId: string, billId: string) => ["orgs", orgId, "inventory", "bills", billId] as const,
  salesOrders: (orgId: string, params: { page: number; pageSize: number; search?: string; status?: string }) =>
    ["orgs", orgId, "inventory", "sales-orders", params.page, params.pageSize, params.search ?? "", params.status ?? ""] as const,
  salesOrder: (orgId: string, orderId: string) => ["orgs", orgId, "inventory", "sales-orders", orderId] as const,
  picklists: (orgId: string, params: { page: number; pageSize: number; status?: string }) =>
    ["orgs", orgId, "inventory", "picklists", params.page, params.pageSize, params.status ?? ""] as const,
  picklist: (orgId: string, picklistId: string) => ["orgs", orgId, "inventory", "picklists", picklistId] as const,
  inventoryPackages: (orgId: string, params: { page: number; pageSize: number; status?: string }) =>
    ["orgs", orgId, "inventory", "packages", params.page, params.pageSize, params.status ?? ""] as const,
  inventoryPackage: (orgId: string, packageId: string) => ["orgs", orgId, "inventory", "packages", packageId] as const,
  compositeItems: (orgId: string, params: { page: number; pageSize: number; search?: string }) =>
    ["orgs", orgId, "inventory", "composite-items", params.page, params.pageSize, params.search ?? ""] as const,
  compositeItem: (orgId: string, compositeId: string) => ["orgs", orgId, "inventory", "composite-items", compositeId] as const,
  // Sales module
  salesPipelineStages: (orgId: string) => ["orgs", orgId, "sales", "pipeline-stages"] as const,
  deals: (
    orgId: string,
    params: {
      page: number;
      pageSize: number;
      search?: string;
      stage_id?: string;
      owner_id?: string;
      lead_id?: string;
      created_after?: string;
      created_before?: string;
      sortBy?: string;
      order?: string;
    }
  ) =>
    [
      "orgs",
      orgId,
      "sales",
      "deals",
      params.page,
      params.pageSize,
      params.search ?? "",
      params.stage_id ?? "",
      params.owner_id ?? "",
      params.lead_id ?? "",
      params.created_after ?? "",
      params.created_before ?? "",
      params.sortBy ?? "created_at",
      params.order ?? "desc",
    ] as const,
  deal: (orgId: string, dealId: string) => ["orgs", orgId, "sales", "deals", dealId] as const,
  dealActivities: (orgId: string, dealId: string) => ["orgs", orgId, "sales", "deals", dealId, "activities"] as const,
  // Activities module (calls, meetings)
  activityCalls: (
    orgId: string,
    params: {
      page: number;
      pageSize: number;
      search?: string;
      leadId?: string;
      dealId?: string;
      dateFrom?: string;
      dateTo?: string;
      ownerId?: string;
    }
  ) =>
    [
      "orgs",
      orgId,
      "activities",
      "calls",
      params.page,
      params.pageSize,
      params.search ?? "",
      params.leadId ?? "",
      params.dealId ?? "",
      params.dateFrom ?? "",
      params.dateTo ?? "",
      params.ownerId ?? "",
    ] as const,
  activityCall: (orgId: string, callId: string) => ["orgs", orgId, "activities", "calls", callId] as const,
  activityMeetings: (
    orgId: string,
    params: {
      page: number;
      pageSize: number;
      search?: string;
      leadId?: string;
      dealId?: string;
      dateFrom?: string;
      dateTo?: string;
      ownerId?: string;
    }
  ) =>
    [
      "orgs",
      orgId,
      "activities",
      "meetings",
      params.page,
      params.pageSize,
      params.search ?? "",
      params.leadId ?? "",
      params.dealId ?? "",
      params.dateFrom ?? "",
      params.dateTo ?? "",
      params.ownerId ?? "",
    ] as const,
  activityMeeting: (orgId: string, meetingId: string) => ["orgs", orgId, "activities", "meetings", meetingId] as const,
  salesStats: (orgId: string) => ["orgs", orgId, "sales", "stats"] as const,
  salesForecast: (orgId: string) => ["orgs", orgId, "sales", "forecast"] as const,
  salesAnalytics: (orgId: string) => ["orgs", orgId, "sales", "analytics"] as const,
  // Finance module
  financeAccounts: (orgId: string, params: { page: number; pageSize: number; search?: string; type?: string }) =>
    ["orgs", orgId, "finance", "accounts", params.page, params.pageSize, params.search ?? "", params.type ?? ""] as const,
  financeAccount: (orgId: string, accountId: string) => ["orgs", orgId, "finance", "accounts", accountId] as const,
  financeJournalEntries: (orgId: string, params: { page: number; pageSize: number; status?: string }) =>
    ["orgs", orgId, "finance", "journal-entries", params.page, params.pageSize, params.status ?? ""] as const,
  financeJournalEntry: (orgId: string, entryId: string) => ["orgs", orgId, "finance", "journal-entries", entryId] as const,
  financeInvoices: (orgId: string, params: { page: number; pageSize: number; status?: string }) =>
    ["orgs", orgId, "finance", "invoices", params.page, params.pageSize, params.status ?? ""] as const,
  financeInvoice: (orgId: string, invoiceId: string) => ["orgs", orgId, "finance", "invoices", invoiceId] as const,
  financeBills: (orgId: string, params: { page: number; pageSize: number; status?: string }) =>
    ["orgs", orgId, "finance", "bills", params.page, params.pageSize, params.status ?? ""] as const,
  financeBill: (orgId: string, billId: string) => ["orgs", orgId, "finance", "bills", billId] as const,
  financeExpenses: (orgId: string, params: { page: number; pageSize: number; status?: string }) =>
    ["orgs", orgId, "finance", "expenses", params.page, params.pageSize, params.status ?? ""] as const,
  financeExpense: (orgId: string, expenseId: string) => ["orgs", orgId, "finance", "expenses", expenseId] as const,
  financeBankAccounts: (orgId: string, params: { page: number; pageSize: number }) =>
    ["orgs", orgId, "finance", "bank-accounts", params.page, params.pageSize] as const,
  financeBankAccount: (orgId: string, accountId: string) => ["orgs", orgId, "finance", "bank-accounts", accountId] as const,
  financeReportTrialBalance: (orgId: string, from: string, to: string) => ["orgs", orgId, "finance", "reports", "trial-balance", from, to] as const,
  financeReportPnL: (orgId: string, from: string, to: string) => ["orgs", orgId, "finance", "reports", "pnl", from, to] as const,
  financeReportBalanceSheet: (orgId: string, asOf: string) => ["orgs", orgId, "finance", "reports", "balance-sheet", asOf] as const,
  financeReportCashFlow: (orgId: string, from: string, to: string) => ["orgs", orgId, "finance", "reports", "cash-flow", from, to] as const,
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
