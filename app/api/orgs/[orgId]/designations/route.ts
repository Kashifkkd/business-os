import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { Designation } from "@/lib/supabase/types";

const DESIGNATION_SELECT =
  "id, tenant_id, name, department_id, sort_order, level, created_at, updated_at";

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
  const departmentId = (searchParams.get("department_id") ?? "").trim() || undefined;

  let query = supabase
    .from("designations")
    .select(DESIGNATION_SELECT)
    .eq("tenant_id", orgId)
    .order("sort_order")
    .order("name");

  if (departmentId) {
    query = query.or(`department_id.eq.${departmentId},department_id.is.null`);
  }

  const { data: rows, error } = await query;

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess((rows ?? []) as Designation[]));
}

export type CreateDesignationBody = {
  name: string;
  department_id?: string | null;
  sort_order?: number;
  level?: number | null;
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

  let body: CreateDesignationBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Name is required"), { status: 400 });
  }

  const insert: Record<string, unknown> = {
    tenant_id: orgId,
    name,
    department_id: typeof body.department_id === "string" && body.department_id.trim() ? body.department_id : null,
    sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
    level: typeof body.level === "number" ? body.level : null,
  };

  const { data: row, error } = await supabase
    .from("designations")
    .insert(insert)
    .select(DESIGNATION_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess(row as Designation), { status: 201 });
}
