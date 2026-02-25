import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { TaskSpace } from "@/lib/supabase/types";

const SPACE_SELECT =
  "id, tenant_id, name, description, sort_order, settings, created_at, updated_at";

/** Ensure org has default statuses (space_id null). Returns status ids. */
async function ensureOrgDefaultStatuses(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string
): Promise<string[]> {
  const { data: existing } = await supabase
    .from("task_statuses")
    .select("id")
    .eq("tenant_id", tenantId)
    .is("space_id", null)
    .limit(3);
  if (existing && existing.length >= 3) {
    return existing.map((r) => r.id);
  }
  const defaults = [
    { name: "To Do", type: "todo", sort_order: 0, color: "#94a3b8" },
    { name: "In Progress", type: "in_progress", sort_order: 1, color: "#3b82f6" },
    { name: "Done", type: "done", sort_order: 2, color: "#22c55e" },
  ];
  const { data: inserted } = await supabase
    .from("task_statuses")
    .insert(
      defaults.map((d) => ({
        tenant_id: tenantId,
        space_id: null,
        name: d.name,
        type: d.type,
        sort_order: d.sort_order,
        color: d.color,
      }))
    )
    .select("id");
  return (inserted ?? []).map((r) => r.id);
}

/** GET list of spaces for the org. */
export async function GET(
  _request: Request,
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

  const { data: rows, error } = await supabase
    .from("task_spaces")
    .select(SPACE_SELECT)
    .eq("tenant_id", orgId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess((rows ?? []) as TaskSpace[]));
}

export type CreateSpaceBody = {
  name: string;
  description?: string | null;
  sort_order?: number;
};

/** POST create a space. Creates default list "Backlog" and ensures org has default statuses. */
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

  let body: CreateSpaceBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Name is required"), { status: 400 });
  }

  await ensureOrgDefaultStatuses(supabase, orgId);

  const { data: space, error: spaceError } = await supabase
    .from("task_spaces")
    .insert({
      tenant_id: orgId,
      name,
      description: typeof body.description === "string" && body.description.trim() ? body.description.trim() : null,
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
    })
    .select(SPACE_SELECT)
    .single();

  if (spaceError || !space) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, spaceError?.message ?? "Failed to create space"), { status: 400 });
  }

  const { error: listError } = await supabase.from("task_lists").insert({
    space_id: space.id,
    name: "Backlog",
    sort_order: 0,
  });

  if (listError) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Space created but default list failed: " + listError.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess(space as TaskSpace), { status: 201 });
}
