import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { DealActivity } from "@/lib/supabase/types";

const ACTIVITY_SELECT =
  "id, tenant_id, deal_id, type, content, metadata, created_at, created_by";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id: dealId } = await params;
  if (!orgId || !dealId) {
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

  const { data: dealRow } = await supabase
    .from("deals")
    .select("id")
    .eq("tenant_id", orgId)
    .eq("id", dealId)
    .single();

  if (!dealRow) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Deal not found"), { status: 404 });
  }

  const { data: rows, error } = await supabase
    .from("deal_activities")
    .select(ACTIVITY_SELECT)
    .eq("tenant_id", orgId)
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess((rows ?? []) as DealActivity[]));
}

const ACTIVITY_TYPES = ["note", "email", "call", "status_change"] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id: dealId } = await params;
  if (!orgId || !dealId) {
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

  const { data: dealRow } = await supabase
    .from("deals")
    .select("id")
    .eq("tenant_id", orgId)
    .eq("id", dealId)
    .single();

  if (!dealRow) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Deal not found"), { status: 404 });
  }

  let body: { type?: string; content?: string | null; metadata?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const type = typeof body.type === "string" && body.type.trim() ? body.type.trim() : "note";
  if (!ACTIVITY_TYPES.includes(type as (typeof ACTIVITY_TYPES)[number])) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid activity type"), { status: 400 });
  }

  const insert = {
    tenant_id: orgId,
    deal_id: dealId,
    type,
    content: typeof body.content === "string" ? body.content.trim() || null : null,
    metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
    created_by: user.id,
  };

  const { data: row, error } = await supabase
    .from("deal_activities")
    .insert(insert)
    .select(ACTIVITY_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess(row as DealActivity), { status: 201 });
}
