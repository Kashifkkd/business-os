import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { TaskList } from "@/lib/supabase/types";

const LIST_SELECT = "id, space_id, name, sort_order, created_at, updated_at";

export type UpdateListBody = Partial<{ name: string; sort_order: number }>;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; spaceId: string; listId: string }> }
) {
  const { orgId, spaceId, listId } = await params;
  if (!orgId || !spaceId || !listId) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId, spaceId or listId"), { status: 400 });
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

  const { data: listRow } = await supabase
    .from("task_lists")
    .select("id, space_id")
    .eq("id", listId)
    .eq("space_id", spaceId)
    .single();

  if (!listRow) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "List not found"), { status: 404 });
  }

  let body: UpdateListBody;
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
  if (typeof body.sort_order === "number") payload.sort_order = body.sort_order;

  if (Object.keys(payload).length === 0) {
    const { data: current } = await supabase
      .from("task_lists")
      .select(LIST_SELECT)
      .eq("id", listId)
      .single();
    return NextResponse.json(apiSuccess(current as TaskList));
  }

  const { data: updated, error } = await supabase
    .from("task_lists")
    .update(payload)
    .eq("id", listId)
    .eq("space_id", spaceId)
    .select(LIST_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess(updated as TaskList));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; spaceId: string; listId: string }> }
) {
  const { orgId, spaceId, listId } = await params;
  if (!orgId || !spaceId || !listId) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId, spaceId or listId"), { status: 400 });
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

  const { data: listRow } = await supabase
    .from("task_lists")
    .select("id")
    .eq("id", listId)
    .eq("space_id", spaceId)
    .single();

  if (!listRow) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "List not found"), { status: 404 });
  }

  const { error } = await supabase
    .from("task_lists")
    .delete()
    .eq("id", listId)
    .eq("space_id", spaceId);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess({ deleted: true }));
}
