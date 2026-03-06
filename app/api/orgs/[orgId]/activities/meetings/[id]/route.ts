import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { ActivityMeeting } from "@/lib/supabase/types";

const MEETING_SELECT =
  "id, tenant_id, lead_id, deal_id, title, description, start_time, end_time, venue, all_day, participant_ids, owner_id, created_by, created_at, updated_at";

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
    .from("activity_meetings")
    .select(MEETING_SELECT)
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (error || !row) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Meeting not found"), { status: 404 });
  }

  return NextResponse.json(
    apiSuccess({
      ...row,
      participant_ids: Array.isArray((row as Record<string, unknown>).participant_ids)
        ? (row as Record<string, unknown>).participant_ids
        : [],
    } as ActivityMeeting)
  );
}

export type UpdateActivityMeetingBody = Partial<{
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  venue: string | null;
  all_day: boolean;
  participant_ids: string[];
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
    .from("activity_meetings")
    .select(MEETING_SELECT)
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Meeting not found"), { status: 404 });
  }

  let body: UpdateActivityMeetingBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body?.title === "string") {
    const t = body.title.trim();
    if (!t) {
      return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Title is required"), { status: 400 });
    }
    payload.title = t;
  }
  if (body?.description !== undefined) {
    payload.description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;
  }
  if (typeof body?.start_time === "string" && body.start_time.trim()) {
    payload.start_time = body.start_time.trim();
  }
  if (typeof body?.end_time === "string" && body.end_time.trim()) {
    payload.end_time = body.end_time.trim();
  }
  if (body?.venue !== undefined) {
    payload.venue = typeof body.venue === "string" && body.venue.trim() ? body.venue.trim() : null;
  }
  if (typeof body?.all_day === "boolean") {
    payload.all_day = body.all_day;
  }
  if (body?.participant_ids !== undefined) {
    payload.participant_ids = Array.isArray(body.participant_ids)
      ? body.participant_ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : [];
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
    return NextResponse.json(
      apiSuccess({
        ...existing,
        participant_ids: Array.isArray((existing as Record<string, unknown>).participant_ids)
          ? (existing as Record<string, unknown>).participant_ids
          : [],
      } as ActivityMeeting)
    );
  }

  const { data: updated, error } = await supabase
    .from("activity_meetings")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId)
    .select(MEETING_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(
    apiSuccess({
      ...updated,
      participant_ids: Array.isArray((updated as Record<string, unknown>).participant_ids)
        ? (updated as Record<string, unknown>).participant_ids
        : [],
    } as ActivityMeeting)
  );
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
    .from("activity_meetings")
    .select("id")
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Meeting not found"), { status: 404 });
  }

  const { error } = await supabase.from("activity_meetings").delete().eq("id", id).eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess({ deleted: true }));
}
