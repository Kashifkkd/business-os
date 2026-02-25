import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { TaskStatus } from "@/lib/supabase/types";

const STATUS_SELECT =
  "id, tenant_id, space_id, name, type, sort_order, color, created_at, updated_at";

/** GET statuses for the space: first space-specific, then fallback to org-level (space_id null). */
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

  const { data: spaceStatuses, error: spaceErr } = await supabase
    .from("task_statuses")
    .select(STATUS_SELECT)
    .eq("tenant_id", orgId)
    .eq("space_id", spaceId)
    .order("sort_order", { ascending: true });

  if (spaceErr) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, spaceErr.message), { status: 400 });
  }

  if (spaceStatuses && spaceStatuses.length > 0) {
    return NextResponse.json(apiSuccess(spaceStatuses as TaskStatus[]));
  }

  const { data: orgStatuses, error: orgErr } = await supabase
    .from("task_statuses")
    .select(STATUS_SELECT)
    .eq("tenant_id", orgId)
    .is("space_id", null)
    .order("sort_order", { ascending: true });

  if (orgErr) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, orgErr.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess((orgStatuses ?? []) as TaskStatus[]));
}

export type CreateStatusBody = {
  name: string;
  type?: "todo" | "in_progress" | "done";
  sort_order?: number;
  color?: string | null;
};

/** POST create a space-specific status. */
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

  let body: CreateStatusBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Name is required"), { status: 400 });
  }

  const type = body.type && ["todo", "in_progress", "done"].includes(body.type) ? body.type : "todo";

  const { data: row, error } = await supabase
    .from("task_statuses")
    .insert({
      tenant_id: orgId,
      space_id: spaceId,
      name,
      type,
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
      color: typeof body.color === "string" && body.color.trim() ? body.color.trim() : null,
    })
    .select(STATUS_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess(row as TaskStatus), { status: 201 });
}
