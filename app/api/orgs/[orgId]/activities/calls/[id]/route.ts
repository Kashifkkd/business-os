import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { ActivityCall } from "@/lib/supabase/types";

const CALL_SELECT =
  "id, tenant_id, lead_id, deal_id, subject, description, call_type, call_status, call_start_time, duration_seconds, call_result, call_agenda, call_purpose, owner_id, created_by, created_at, updated_at";

const CALL_TYPE_VALUES = ["inbound", "outbound"] as const;
const CALL_STATUS_VALUES = ["attended", "missed", "busy", "no_answer", "other"] as const;

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
    .from("activity_calls")
    .select(CALL_SELECT)
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (error || !row) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Call not found"), { status: 404 });
  }

  return NextResponse.json(apiSuccess(row as ActivityCall));
}

export type UpdateActivityCallBody = Partial<{
  subject: string | null;
  description: string | null;
  call_type: string;
  call_status: string;
  call_start_time: string;
  duration_seconds: number | null;
  call_result: string | null;
  call_agenda: string | null;
  call_purpose: string | null;
  lead_id: string | null;
  deal_id: string | null;
  owner_id: string | null;
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
    .from("activity_calls")
    .select(CALL_SELECT)
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Call not found"), { status: 404 });
  }

  let body: UpdateActivityCallBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (body?.subject !== undefined) {
    payload.subject = typeof body.subject === "string" && body.subject.trim() ? body.subject.trim() : null;
  }
  if (body?.description !== undefined) {
    payload.description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;
  }
  if (typeof body?.call_type === "string" && CALL_TYPE_VALUES.includes(body.call_type as (typeof CALL_TYPE_VALUES)[number])) {
    payload.call_type = body.call_type;
  }
  if (typeof body?.call_status === "string" && CALL_STATUS_VALUES.includes(body.call_status as (typeof CALL_STATUS_VALUES)[number])) {
    payload.call_status = body.call_status;
  }
  if (typeof body?.call_start_time === "string" && body.call_start_time.trim()) {
    payload.call_start_time = body.call_start_time.trim();
  }
  if (body?.duration_seconds !== undefined) {
    payload.duration_seconds =
      typeof body.duration_seconds === "number" && body.duration_seconds >= 0 ? body.duration_seconds : null;
  }
  if (body?.call_result !== undefined) {
    payload.call_result = typeof body.call_result === "string" && body.call_result.trim() ? body.call_result.trim() : null;
  }
  if (body?.call_agenda !== undefined) {
    payload.call_agenda = typeof body.call_agenda === "string" && body.call_agenda.trim() ? body.call_agenda.trim() : null;
  }
  if (body?.call_purpose !== undefined) {
    payload.call_purpose = typeof body.call_purpose === "string" && body.call_purpose.trim() ? body.call_purpose.trim() : null;
  }
  if (body?.lead_id !== undefined) {
    payload.lead_id = typeof body.lead_id === "string" && body.lead_id.trim() ? body.lead_id.trim() : null;
  }
  if (body?.deal_id !== undefined) {
    payload.deal_id = typeof body.deal_id === "string" && body.deal_id.trim() ? body.deal_id.trim() : null;
  }
  if (body?.owner_id !== undefined) {
    payload.owner_id = typeof body.owner_id === "string" && body.owner_id.trim() ? body.owner_id.trim() : null;
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(apiSuccess(existing as ActivityCall));
  }

  const { data: updated, error } = await supabase
    .from("activity_calls")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId)
    .select(CALL_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess(updated as ActivityCall));
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
    .from("activity_calls")
    .select("id")
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Call not found"), { status: 404 });
  }

  const { error } = await supabase.from("activity_calls").delete().eq("id", id).eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess({ deleted: true }));
}
