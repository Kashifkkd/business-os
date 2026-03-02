import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { Deal } from "@/lib/supabase/types";

const DEAL_SELECT =
  "id, tenant_id, name, lead_id, stage_id, owner_id, value, actual_value, probability, expected_close_date, close_date, notes, metadata, created_at, updated_at";

export type ConvertLeadBody = {
  lead_id: string;
  name?: string;
  value?: number;
  stage_id?: string;
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

  let body: ConvertLeadBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const leadId = typeof body.lead_id === "string" ? body.lead_id.trim() : "";
  if (!leadId) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "lead_id is required"), { status: 400 });
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, name, company")
    .eq("tenant_id", orgId)
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Lead not found"), { status: 404 });
  }

  const { data: firstStage } = await supabase
    .from("sales_pipeline_stages")
    .select("id")
    .eq("tenant_id", orgId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .single();

  if (!firstStage) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "No pipeline stages configured"), { status: 400 });
  }

  const dealName = typeof body.name === "string" && body.name.trim() ? body.name.trim() : `${lead.name}${lead.company ? ` - ${lead.company}` : ""}`;
  const stageId = typeof body.stage_id === "string" && body.stage_id.trim() ? body.stage_id.trim() : firstStage.id;

  const { data: stageRow } = await supabase
    .from("sales_pipeline_stages")
    .select("id")
    .eq("tenant_id", orgId)
    .eq("id", stageId)
    .single();
  if (!stageRow) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid stage_id"), { status: 400 });
  }

  const insert = {
    tenant_id: orgId,
    name: dealName,
    lead_id: leadId,
    stage_id: stageId,
    owner_id: user.id,
    value: typeof body.value === "number" && body.value >= 0 ? body.value : 0,
    metadata: {},
  };

  const { data: row, error } = await supabase
    .from("deals")
    .insert(insert)
    .select(DEAL_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const deal = {
    ...row,
    value: Number(row.value),
    actual_value: row.actual_value != null ? Number(row.actual_value) : null,
    probability: row.probability != null ? Number(row.probability) : null,
  } as Deal;
  return NextResponse.json(apiSuccess(deal), { status: 201 });
}
