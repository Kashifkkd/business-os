import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { TaskSpace } from "@/lib/supabase/types";

const SPACE_SELECT =
  "id, tenant_id, name, description, sort_order, settings, created_at, updated_at";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; spaceId: string }> }
) {
  const { orgId, spaceId } = await params;
  if (!orgId || !spaceId) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId or spaceId"), { status: 400 });
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
    .from("task_spaces")
    .select(SPACE_SELECT)
    .eq("tenant_id", orgId)
    .eq("id", spaceId)
    .single();

  if (error || !row) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Space not found"), { status: 404 });
  }

  return NextResponse.json(apiSuccess(row as TaskSpace));
}

export type UpdateSpaceBody = Partial<{
  name: string;
  description: string | null;
  sort_order: number;
  settings: Record<string, unknown>;
}>;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; spaceId: string }> }
) {
  const { orgId, spaceId } = await params;
  if (!orgId || !spaceId) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId or spaceId"), { status: 400 });
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
    .from("task_spaces")
    .select(SPACE_SELECT)
    .eq("tenant_id", orgId)
    .eq("id", spaceId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Space not found"), { status: 404 });
  }

  let body: UpdateSpaceBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const t = body.name.trim();
    if (!t) {
      return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Name cannot be empty"), { status: 400 });
    }
    payload.name = t;
  }
  if (body.description !== undefined) payload.description = body.description;
  if (typeof body.sort_order === "number") payload.sort_order = body.sort_order;
  if (body.settings !== undefined && typeof body.settings === "object") payload.settings = body.settings;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(apiSuccess(existing as TaskSpace));
  }

  const { data: updated, error } = await supabase
    .from("task_spaces")
    .update(payload)
    .eq("id", spaceId)
    .eq("tenant_id", orgId)
    .select(SPACE_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess(updated as TaskSpace));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; spaceId: string }> }
) {
  const { orgId, spaceId } = await params;
  if (!orgId || !spaceId) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId or spaceId"), { status: 400 });
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

  const { error } = await supabase
    .from("task_spaces")
    .delete()
    .eq("id", spaceId)
    .eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess({ deleted: true }));
}
