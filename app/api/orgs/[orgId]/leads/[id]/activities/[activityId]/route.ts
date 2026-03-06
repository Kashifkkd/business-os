import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { LeadActivity } from "@/lib/supabase/types";

const ACTIVITY_SELECT =
  "id, tenant_id, lead_id, type, content, metadata, created_at, created_by";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; id: string; activityId: string }> }
) {
  const { orgId, id: leadId, activityId } = await params;
  if (!orgId || !leadId || !activityId) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId, leadId, or activityId"), {
      status: 400,
    });
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

  const { data: activity } = await supabase
    .from("lead_activities")
    .select("id, lead_id, type")
    .eq("tenant_id", orgId)
    .eq("lead_id", leadId)
    .eq("id", activityId)
    .single();

  if (!activity) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Activity not found"), { status: 404 });
  }

  let body: { content?: string | null; metadata?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body.content === "string") {
    update.content = body.content.trim() || null;
  }
  if (body.metadata && typeof body.metadata === "object") {
    update.metadata = body.metadata;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "No fields to update"), {
      status: 400,
    });
  }

  const { data: row, error } = await supabase
    .from("lead_activities")
    .update(update)
    .eq("id", activityId)
    .eq("tenant_id", orgId)
    .eq("lead_id", leadId)
    .select(ACTIVITY_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess(row as LeadActivity));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string; activityId: string }> }
) {
  const { orgId, id: leadId, activityId } = await params;
  if (!orgId || !leadId || !activityId) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId, leadId, or activityId"), {
      status: 400,
    });
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

  const { data: activity, error: fetchError } = await supabase
    .from("lead_activities")
    .select("id")
    .eq("tenant_id", orgId)
    .eq("lead_id", leadId)
    .eq("id", activityId)
    .single();

  if (fetchError || !activity) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Activity not found"), { status: 404 });
  }

  const { error } = await supabase
    .from("lead_activities")
    .delete()
    .eq("id", activityId)
    .eq("tenant_id", orgId)
    .eq("lead_id", leadId);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess({ deleted: true }));
}
