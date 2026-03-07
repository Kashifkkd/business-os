import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import { createActivityLog, ACTIONS, ENTITY_TYPES } from "@/lib/activity-log";
import type { Employee } from "@/lib/supabase/types";

const EMPLOYEE_SELECT =
  "id, tenant_id, profile_id, department_id, designation_id, reports_to_id, employee_number, join_date, leave_date, is_active, metadata, created_at, updated_at";

function buildDisplayName(profile: { first_name?: string | null; last_name?: string | null; email?: string | null } | null): string | null {
  if (!profile) return null;
  const first = profile.first_name?.trim();
  const last = profile.last_name?.trim();
  if (first || last) return [first, last].filter(Boolean).join(" ").trim() || null;
  return profile.email?.trim() || null;
}

export interface GetEmployeesResult {
  items: Employee[];
  total: number;
  page: number;
  pageSize: number;
}

/** GET list of employees. Query: page, pageSize, search, department_id, designation_id, is_active */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId"), { status: 400 });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Org not found"), { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(apiError(API_ERROR_CODES.UNAUTHORIZED, "Unauthorized"), { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 10));
  const search = (searchParams.get("search") ?? "").trim() || undefined;
  const departmentId = (searchParams.get("department_id") ?? "").trim() || undefined;
  const designationId = (searchParams.get("designation_id") ?? "").trim() || undefined;
  const isActiveParam = searchParams.get("is_active");
  const is_active = isActiveParam === "" || isActiveParam === null ? undefined : isActiveParam === "true";

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const selectWithJoins = `${EMPLOYEE_SELECT}, department:departments(name), designation:designations(name), profile:profiles(first_name, last_name, email)`;
  const useRange = !search;

  let query = supabase
    .from("employees")
    .select(selectWithJoins, useRange ? { count: "exact" } : undefined)
    .eq("tenant_id", orgId)
    .order("created_at", { ascending: false });

  if (departmentId) query = query.eq("department_id", departmentId);
  if (designationId) query = query.eq("designation_id", designationId);
  if (typeof is_active === "boolean") query = query.eq("is_active", is_active);

  if (useRange) {
    query = query.range(from, to);
  }

  const { data: rows, error, count } = await query;

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  type Row = Record<string, unknown> & {
    department?: { name: string } | null;
    designation?: { name: string } | null;
    profile?: { first_name: string | null; last_name: string | null; email: string | null } | null;
  };

  let items = (rows ?? []).map((row: Row) => {
    const { department, designation, profile, ...rest } = row;
    const department_name = department?.name ?? null;
    const designation_name = designation?.name ?? null;
    const display_name = buildDisplayName(profile ?? null);
    return {
      ...rest,
      department_name,
      designation_name,
      display_name: display_name ?? (rest.employee_number as string) ?? `Employee`,
      reports_to_name: null as string | null,
    } as Employee & { reports_to_name: string | null };
  });

  const reportsToIds = [...new Set(items.map((e) => e.reports_to_id).filter(Boolean))] as string[];
  if (reportsToIds.length > 0) {
    const { data: managerRows } = await supabase
      .from("employees")
      .select("id, profile:profiles(first_name, last_name, email)")
      .in("id", reportsToIds);
    const managerNames = new Map<string, string>();
    for (const m of managerRows ?? []) {
      const r = m as { id: string; profile?: { first_name: string | null; last_name: string | null; email: string | null } | null };
      const name = buildDisplayName(r.profile ?? null);
      if (name) managerNames.set(r.id, name);
    }
    items = items.map((e) => ({
      ...e,
      reports_to_name: e.reports_to_id ? managerNames.get(e.reports_to_id) ?? null : null,
    }));
  }

  if (search) {
    const term = search.toLowerCase();
    items = items.filter(
      (e) =>
        (e.display_name?.toLowerCase().includes(term)) ||
        (e.employee_number?.toLowerCase().includes(term)) ||
        (e.department_name?.toLowerCase().includes(term)) ||
        (e.designation_name?.toLowerCase().includes(term))
    );
    const total = items.length;
    const paginated = items.slice(from, from + pageSize);
    return NextResponse.json(apiSuccess<GetEmployeesResult>({ items: paginated, total, page, pageSize }, total));
  }

  const total = count ?? 0;
  return NextResponse.json(apiSuccess<GetEmployeesResult>({ items, total, page, pageSize }, total));
}

export type CreateEmployeeBody = {
  profile_id?: string | null;
  department_id: string;
  designation_id: string;
  reports_to_id?: string | null;
  employee_number?: string | null;
  join_date?: string | null;
  leave_date?: string | null;
  is_active?: boolean;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId"), { status: 400 });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Org not found"), { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(apiError(API_ERROR_CODES.UNAUTHORIZED, "Unauthorized"), { status: 401 });
  }

  let body: CreateEmployeeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const department_id = typeof body.department_id === "string" ? body.department_id.trim() : "";
  const designation_id = typeof body.designation_id === "string" ? body.designation_id.trim() : "";
  if (!department_id || !designation_id) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Department and designation are required"), { status: 400 });
  }

  const insert: Record<string, unknown> = {
    tenant_id: orgId,
    profile_id: typeof body.profile_id === "string" && body.profile_id.trim() ? body.profile_id : null,
    department_id,
    designation_id,
    reports_to_id: typeof body.reports_to_id === "string" && body.reports_to_id.trim() ? body.reports_to_id : null,
    employee_number: typeof body.employee_number === "string" && body.employee_number.trim() ? body.employee_number.trim() : null,
    join_date: typeof body.join_date === "string" && body.join_date.trim() ? body.join_date : null,
    leave_date: typeof body.leave_date === "string" && body.leave_date.trim() ? body.leave_date : null,
    is_active: typeof body.is_active === "boolean" ? body.is_active : true,
  };

  const { data: row, error } = await supabase
    .from("employees")
    .insert(insert)
    .select(EMPLOYEE_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const employee = row as Employee & { employee_number?: string | null };
  await createActivityLog(supabase, {
    tenantId: orgId,
    userId: user.id,
    action: ACTIONS.CREATE,
    resourceType: ENTITY_TYPES.EMPLOYEE,
    resourceId: employee.id,
    description: `Created employee ${employee.employee_number ? `(${employee.employee_number})` : ""}`.trim() || "Created employee",
    metadata: {},
  });

  return NextResponse.json(apiSuccess(employee), { status: 201 });
}
