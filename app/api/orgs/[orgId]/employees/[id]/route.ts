import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId or id"), { status: 400 });
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

  const { data: row, error } = await supabase
    .from("employees")
    .select(
      `${EMPLOYEE_SELECT}, department:departments(name), designation:designations(name), profile:profiles(first_name, last_name, email)`
    )
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (error || !row) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Employee not found"), { status: 404 });
  }

  type Row = typeof row & {
    department?: { name: string } | null;
    designation?: { name: string } | null;
    profile?: { first_name: string | null; last_name: string | null; email: string | null } | null;
  };
  const r = row as Row;
  const department_name = r.department?.name ?? null;
  const designation_name = r.designation?.name ?? null;
  const display_name = buildDisplayName(r.profile ?? null);

  let reports_to_name: string | null = null;
  if (r.reports_to_id) {
    const { data: manager } = await supabase
      .from("employees")
      .select("profile:profiles(first_name, last_name, email)")
      .eq("id", r.reports_to_id)
      .single();
    const m = manager as { profile?: { first_name: string | null; last_name: string | null; email: string | null } | null } | null;
    reports_to_name = buildDisplayName(m?.profile ?? null);
  }

  const employee: Employee = {
    id: r.id,
    tenant_id: r.tenant_id,
    profile_id: r.profile_id,
    department_id: r.department_id,
    designation_id: r.designation_id,
    reports_to_id: r.reports_to_id,
    employee_number: r.employee_number,
    join_date: r.join_date,
    leave_date: r.leave_date,
    is_active: r.is_active,
    metadata: r.metadata ?? undefined,
    created_at: r.created_at,
    updated_at: r.updated_at,
    department_name,
    designation_name,
    display_name: display_name ?? r.employee_number ?? "Employee",
    reports_to_name,
  };

  return NextResponse.json(apiSuccess(employee));
}

export type UpdateEmployeeBody = Partial<{
  profile_id: string | null;
  department_id: string;
  designation_id: string;
  reports_to_id: string | null;
  employee_number: string | null;
  join_date: string | null;
  leave_date: string | null;
  is_active: boolean;
}>;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId or id"), { status: 400 });
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

  const { data: existing, error: fetchError } = await supabase
    .from("employees")
    .select(EMPLOYEE_SELECT)
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Employee not found"), { status: 404 });
  }

  let body: UpdateEmployeeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (body.profile_id !== undefined) {
    payload.profile_id = typeof body.profile_id === "string" && body.profile_id.trim() ? body.profile_id : null;
  }
  if (typeof body.department_id === "string" && body.department_id.trim()) {
    payload.department_id = body.department_id.trim();
  }
  if (typeof body.designation_id === "string" && body.designation_id.trim()) {
    payload.designation_id = body.designation_id.trim();
  }
  if (body.reports_to_id !== undefined) {
    payload.reports_to_id = typeof body.reports_to_id === "string" && body.reports_to_id.trim() ? body.reports_to_id : null;
  }
  if (body.employee_number !== undefined) {
    payload.employee_number = typeof body.employee_number === "string" && body.employee_number.trim() ? body.employee_number.trim() : null;
  }
  if (body.join_date !== undefined) {
    payload.join_date = typeof body.join_date === "string" && body.join_date.trim() ? body.join_date : null;
  }
  if (body.leave_date !== undefined) {
    payload.leave_date = typeof body.leave_date === "string" && body.leave_date.trim() ? body.leave_date : null;
  }
  if (typeof body.is_active === "boolean") {
    payload.is_active = body.is_active;
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(apiSuccess(existing as Employee));
  }

  const { data: updated, error } = await supabase
    .from("employees")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId)
    .select(EMPLOYEE_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess(updated as Employee));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId or id"), { status: 400 });
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

  const { data: existing, error: fetchError } = await supabase
    .from("employees")
    .select("id")
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Employee not found"), { status: 404 });
  }

  const { error } = await supabase.from("employees").delete().eq("id", id).eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess({ deleted: true }));
}
