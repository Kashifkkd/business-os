import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { ActivityCall } from "@/lib/supabase/types";

const CALL_SELECT =
  "id, tenant_id, lead_id, deal_id, subject, description, call_type, call_status, call_start_time, duration_seconds, call_result, call_agenda, call_purpose, owner_id, created_by, created_at, updated_at";

const CALL_TYPE_VALUES = ["inbound", "outbound"] as const;
const CALL_STATUS_VALUES = ["attended", "missed", "busy", "no_answer", "other"] as const;

export interface GetActivityCallsResult {
  items: ActivityCall[];
  total: number;
  page: number;
  pageSize: number;
}

/** GET list of activity calls. Query: page, pageSize, search, leadId, dealId, dateFrom, dateTo, ownerId */
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
    .from("activity_calls")
    .select(CALL_SELECT, { count: "exact" })
    .eq("tenant_id", orgId)
    .order("call_start_time", { ascending: false })
    .range(from, to);

  if (search) {
    const term = `%${search}%`;
    query = query.or(`subject.ilike.${term},description.ilike.${term},call_result.ilike.${term}`);
  }
  if (leadId) query = query.eq("lead_id", leadId);
  if (dealId) query = query.eq("deal_id", dealId);
  if (dateFrom) {
    const d = dateFrom.includes("T") ? dateFrom : `${dateFrom}T00:00:00.000Z`;
    query = query.gte("call_start_time", d);
  }
  if (dateTo) {
    const d = dateTo.includes("T") ? dateTo : `${dateTo}T23:59:59.999Z`;
    query = query.lte("call_start_time", d);
  }
  if (ownerId) query = query.eq("owner_id", ownerId);

  const { data: rows, error, count } = await query;

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const items = (rows ?? []) as ActivityCall[];
  const total = count ?? 0;
  return NextResponse.json(apiSuccess<GetActivityCallsResult>({ items, total, page, pageSize }, total));
}

export type CreateActivityCallBody = {
  subject?: string | null;
  description?: string | null;
  call_type?: string;
  call_status?: string;
  call_start_time: string;
  duration_seconds?: number | null;
  call_result?: string | null;
  call_agenda?: string | null;
  call_purpose?: string | null;
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

  let body: CreateActivityCallBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const callStartTime = typeof body.call_start_time === "string" ? body.call_start_time.trim() : "";
  if (!callStartTime) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Call start time is required"), { status: 400 });
  }

  const callType =
    typeof body.call_type === "string" && CALL_TYPE_VALUES.includes(body.call_type as (typeof CALL_TYPE_VALUES)[number])
      ? body.call_type
      : "outbound";
  const callStatus =
    typeof body.call_status === "string" && CALL_STATUS_VALUES.includes(body.call_status as (typeof CALL_STATUS_VALUES)[number])
      ? body.call_status
      : "attended";

  const insert = {
    tenant_id: orgId,
    lead_id: typeof body.lead_id === "string" && body.lead_id.trim() ? body.lead_id.trim() : null,
    deal_id: typeof body.deal_id === "string" && body.deal_id.trim() ? body.deal_id.trim() : null,
    subject: typeof body.subject === "string" && body.subject.trim() ? body.subject.trim() : null,
    description: typeof body.description === "string" && body.description.trim() ? body.description.trim() : null,
    call_type: callType,
    call_status: callStatus,
    call_start_time: callStartTime,
    duration_seconds:
      typeof body.duration_seconds === "number" && body.duration_seconds >= 0 ? body.duration_seconds : null,
    call_result: typeof body.call_result === "string" && body.call_result.trim() ? body.call_result.trim() : null,
    call_agenda: typeof body.call_agenda === "string" && body.call_agenda.trim() ? body.call_agenda.trim() : null,
    call_purpose: typeof body.call_purpose === "string" && body.call_purpose.trim() ? body.call_purpose.trim() : null,
    owner_id: typeof body.owner_id === "string" && body.owner_id.trim() ? body.owner_id.trim() : null,
    created_by: user.id,
  };

  const { data: row, error } = await supabase
    .from("activity_calls")
    .insert(insert)
    .select(CALL_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess(row as ActivityCall), { status: 201 });
}
