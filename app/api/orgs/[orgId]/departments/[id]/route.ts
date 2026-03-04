import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { Department } from "@/lib/supabase/types";

const DEPARTMENT_SELECT =
  "id, tenant_id, name, code, parent_id, sort_order, created_at, updated_at, created_by";

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
    .from("departments")
    .select(DEPARTMENT_SELECT)
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (error || !row) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Department not found"), { status: 404 });
  }

  return NextResponse.json(apiSuccess(row as Department));
}

export type UpdateDepartmentBody = Partial<{
  name: string;
  code: string | null;
  parent_id: string | null;
  sort_order: number;
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
    .from("departments")
    .select(DEPARTMENT_SELECT)
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Department not found"), { status: 404 });
  }

  let body: UpdateDepartmentBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const nameTrim = body.name.trim();
    if (!nameTrim) {
      return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Name is required"), { status: 400 });
    }
    payload.name = nameTrim;
  }
  if (body.code !== undefined) {
    payload.code = typeof body.code === "string" && body.code.trim() ? body.code.trim() : null;
  }
  if (body.parent_id !== undefined) {
    payload.parent_id = typeof body.parent_id === "string" && body.parent_id.trim() ? body.parent_id : null;
  }
  if (typeof body.sort_order === "number") {
    payload.sort_order = body.sort_order;
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(apiSuccess(existing as Department));
  }

  const { data: updated, error } = await supabase
    .from("departments")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId)
    .select(DEPARTMENT_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess(updated as Department));
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
    .from("departments")
    .select("id")
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Department not found"), { status: 404 });
  }

  const { error } = await supabase.from("departments").delete().eq("id", id).eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess({ deleted: true }));
}
