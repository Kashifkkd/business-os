import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";

/** PATCH: bulk update stage. Body: { ids: string[], stage_id: string } */
/** DELETE: bulk delete. Body: { ids: string[] } */
export async function PATCH(
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

  let body: { ids?: string[]; stage_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string" && id.length > 0) : [];
  const stage_id = typeof body.stage_id === "string" && body.stage_id.trim() ? body.stage_id.trim() : null;

  if (ids.length === 0) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "ids array is required"), { status: 400 });
  }
  if (!stage_id) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "stage_id is required"), { status: 400 });
  }

  const { data: stageRow } = await supabase
    .from("lead_stages")
    .select("id")
    .eq("tenant_id", orgId)
    .eq("id", stage_id)
    .maybeSingle();
  if (!stageRow) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid stage_id for this org"), { status: 400 });
  }

  const { data, error } = await supabase
    .from("leads")
    .update({ stage_id })
    .eq("tenant_id", orgId)
    .in("id", ids)
    .select("id");

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess({ updated: (data ?? []).length }));
}

export async function DELETE(
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

  let body: { ids?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string" && id.length > 0) : [];

  if (ids.length === 0) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "ids array is required"), { status: 400 });
  }

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("tenant_id", orgId)
    .in("id", ids);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess({ deleted: ids.length }));
}
