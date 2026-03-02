import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { Deal } from "@/lib/supabase/types";

const DEAL_SELECT =
  "id, tenant_id, name, lead_id, stage_id, owner_id, value, actual_value, probability, expected_close_date, close_date, notes, metadata, created_at, updated_at";

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
    .from("deals")
    .select(DEAL_SELECT)
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (error || !row) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Deal not found"), { status: 404 });
  }

  const deal = {
    ...row,
    value: Number(row.value),
    actual_value: row.actual_value != null ? Number(row.actual_value) : null,
    probability: row.probability != null ? Number(row.probability) : null,
  } as Deal;
  return NextResponse.json(apiSuccess(deal));
}

export type UpdateDealBody = Partial<{
  name: string;
  lead_id: string | null;
  stage_id: string;
  owner_id: string | null;
  value: number;
  actual_value: number | null;
  probability: number | null;
  expected_close_date: string | null;
  close_date: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
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
    .from("deals")
    .select(DEAL_SELECT)
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Deal not found"), { status: 404 });
  }

  let body: UpdateDealBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body?.name === "string") {
    const nameTrim = body.name.trim();
    if (!nameTrim) {
      return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Name is required"), { status: 400 });
    }
    payload.name = nameTrim;
  }
  if (body?.lead_id !== undefined) payload.lead_id = body.lead_id;
  if (typeof body?.stage_id === "string" && body.stage_id.trim()) {
    payload.stage_id = body.stage_id.trim();
  }
  if (body?.owner_id !== undefined) payload.owner_id = body.owner_id;
  if (typeof body?.value === "number") payload.value = body.value;
  if (body?.actual_value !== undefined) payload.actual_value = body.actual_value;
  if (body?.probability !== undefined) payload.probability = body.probability;
  if (body?.expected_close_date !== undefined) payload.expected_close_date = body.expected_close_date;
  if (body?.close_date !== undefined) payload.close_date = body.close_date;
  if (body?.notes !== undefined) payload.notes = body.notes;
  if (body?.metadata !== undefined && typeof body.metadata === "object" && !Array.isArray(body.metadata)) {
    payload.metadata = body.metadata;
  }

  if (Object.keys(payload).length === 0) {
    const deal = {
      ...existing,
      value: Number(existing.value),
      actual_value: existing.actual_value != null ? Number(existing.actual_value) : null,
      probability: existing.probability != null ? Number(existing.probability) : null,
    } as Deal;
    return NextResponse.json(apiSuccess(deal));
  }

  const { data: updated, error } = await supabase
    .from("deals")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId)
    .select(DEAL_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const deal = {
    ...updated,
    value: Number(updated.value),
    actual_value: updated.actual_value != null ? Number(updated.actual_value) : null,
    probability: updated.probability != null ? Number(updated.probability) : null,
  } as Deal;
  return NextResponse.json(apiSuccess(deal));
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
    .from("deals")
    .select("id")
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Deal not found"), { status: 404 });
  }

  const { error } = await supabase.from("deals").delete().eq("id", id).eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess({ deleted: true }));
}
