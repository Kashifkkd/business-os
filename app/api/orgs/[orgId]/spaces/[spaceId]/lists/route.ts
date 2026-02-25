import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { TaskList } from "@/lib/supabase/types";

const LIST_SELECT = "id, space_id, name, sort_order, created_at, updated_at";

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
    .from("task_lists")
    .select(LIST_SELECT)
    .eq("space_id", spaceId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess((rows ?? []) as TaskList[]));
}

export type CreateListBody = { name: string; sort_order?: number };

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

  let body: CreateListBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Name is required"), { status: 400 });
  }

  const { data: row, error } = await supabase
    .from("task_lists")
    .insert({
      space_id: spaceId,
      name,
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
    })
    .select(LIST_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess(row as TaskList), { status: 201 });
}
