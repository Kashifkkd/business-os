import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { ActivityMeeting } from "@/lib/supabase/types";

const MEETING_SELECT =
  "id, tenant_id, lead_id, deal_id, title, description, start_time, end_time, venue, all_day, participant_ids, owner_id, created_by, created_at, updated_at";

export interface GetActivityMeetingsResult {
  items: ActivityMeeting[];
  total: number;
  page: number;
  pageSize: number;
}

/** GET list of activity meetings. Query: page, pageSize, search, leadId, dealId, dateFrom, dateTo, ownerId */
export async function GET(
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

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 10));
  const search = (searchParams.get("search") ?? "").trim() || undefined;
  const leadId = (searchParams.get("leadId") ?? "").trim() || undefined;
  const dealId = (searchParams.get("dealId") ?? "").trim() || undefined;
  const dateFrom = (searchParams.get("dateFrom") ?? "").trim() || undefined;
  const dateTo = (searchParams.get("dateTo") ?? "").trim() || undefined;
  const ownerId = (searchParams.get("ownerId") ?? "").trim() || undefined;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("activity_meetings")
    .select(MEETING_SELECT, { count: "exact" })
    .eq("tenant_id", orgId)
    .order("start_time", { ascending: false })
    .range(from, to);

  if (search) {
    const term = `%${search}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term},venue.ilike.${term}`);
  }
  if (leadId) query = query.eq("lead_id", leadId);
  if (dealId) query = query.eq("deal_id", dealId);
  if (dateFrom) {
    const d = dateFrom.includes("T") ? dateFrom : `${dateFrom}T00:00:00.000Z`;
    query = query.gte("start_time", d);
  }
  if (dateTo) {
    const d = dateTo.includes("T") ? dateTo : `${dateTo}T23:59:59.999Z`;
    query = query.lte("start_time", d);
  }
  if (ownerId) query = query.eq("owner_id", ownerId);

  const { data: rows, error, count } = await query;

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const items = (rows ?? []).map((r) => ({
    ...r,
    participant_ids: Array.isArray(r.participant_ids) ? r.participant_ids : [],
  })) as ActivityMeeting[];
  const total = count ?? 0;
  return NextResponse.json(apiSuccess<GetActivityMeetingsResult>({ items, total, page, pageSize }, total));
}

export type CreateActivityMeetingBody = {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  venue?: string | null;
  all_day?: boolean;
  participant_ids?: string[];
  lead_id?: string | null;
  deal_id?: string | null;
  owner_id?: string | null;
};

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

  let body: CreateActivityMeetingBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Title is required"), { status: 400 });
  }

  const startTime = typeof body.start_time === "string" ? body.start_time.trim() : "";
  const endTime = typeof body.end_time === "string" ? body.end_time.trim() : "";
  if (!startTime || !endTime) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Start time and end time are required"), {
      status: 400,
    });
  }

  const participantIds = Array.isArray(body.participant_ids)
    ? body.participant_ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    : [];

  const insert = {
    tenant_id: orgId,
    lead_id: typeof body.lead_id === "string" && body.lead_id.trim() ? body.lead_id.trim() : null,
    deal_id: typeof body.deal_id === "string" && body.deal_id.trim() ? body.deal_id.trim() : null,
    title,
    description: typeof body.description === "string" && body.description.trim() ? body.description.trim() : null,
    start_time: startTime,
    end_time: endTime,
    venue: typeof body.venue === "string" && body.venue.trim() ? body.venue.trim() : null,
    all_day: typeof body.all_day === "boolean" ? body.all_day : false,
    participant_ids: participantIds,
    owner_id: typeof body.owner_id === "string" && body.owner_id.trim() ? body.owner_id.trim() : null,
    created_by: user.id,
  };

  const { data: row, error } = await supabase
    .from("activity_meetings")
    .insert(insert)
    .select(MEETING_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(
    apiSuccess({
      ...row,
      participant_ids: Array.isArray((row as Record<string, unknown>).participant_ids)
        ? (row as Record<string, unknown>).participant_ids
        : [],
    } as ActivityMeeting),
    { status: 201 }
  );
}
