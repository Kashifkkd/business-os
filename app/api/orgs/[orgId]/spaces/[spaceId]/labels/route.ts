import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { TaskLabel } from "@/lib/supabase/types";

const LABEL_SELECT = "id, tenant_id, space_id, name, color, sort_order, created_at, updated_at";

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

  const { data: spaceRow } = await supabase
    .from("task_spaces")
    .select("id")
    .eq("tenant_id", orgId)
    .eq("id", spaceId)
    .single();

  if (!spaceRow) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Space not found"), { status: 404 });
  }

  const { data: rows, error } = await supabase
    .from("task_labels")
    .select(LABEL_SELECT)
    .eq("tenant_id", orgId)
    .or(`space_id.eq.${spaceId},space_id.is.null`)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess((rows ?? []) as TaskLabel[]));
}

export type CreateLabelBody = { name: string; color?: string | null; sort_order?: number };

export async function POST(
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

  const { data: spaceRow } = await supabase
    .from("task_spaces")
    .select("id")
    .eq("tenant_id", orgId)
    .eq("id", spaceId)
    .single();

  if (!spaceRow) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Space not found"), { status: 404 });
  }

  let body: CreateLabelBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "name is required"), { status: 400 });
  }

  const color = typeof body.color === "string" ? body.color.trim() || null : null;
  const sortOrder = typeof body.sort_order === "number" ? body.sort_order : 0;

  const { data: label, error } = await supabase
    .from("task_labels")
    .insert({
      tenant_id: orgId,
      space_id: spaceId,
      name,
      color,
      sort_order: sortOrder,
    })
    .select(LABEL_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess(label as TaskLabel), { status: 201 });
}
