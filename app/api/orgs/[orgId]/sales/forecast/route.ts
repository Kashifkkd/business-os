import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";

export interface SalesForecastResult {
  byStage: { stage_id: string; stage_name: string; count: number; value: number; weightedValue: number }[];
  totalPipelineValue: number;
  weightedPipelineValue: number;
  expectedCloseByMonth: { month: string; count: number; value: number }[];
}

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

  const { data: stages } = await supabase
    .from("sales_pipeline_stages")
    .select("id, name, is_won, is_lost, sort_order")
    .eq("tenant_id", orgId)
    .order("sort_order", { ascending: true });

  const stageMap = new Map((stages ?? []).map((s) => [s.id, s]));

  const { data: allDeals, error } = await supabase
    .from("deals")
    .select("stage_id, value, probability, expected_close_date")
    .eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const all = (allDeals ?? []) as { stage_id: string; value: string; probability: number | null; expected_close_date: string | null }[];
  let totalPipelineValue = 0;
  let weightedPipelineValue = 0;
  const byStageMap = new Map<string, { stage_name: string; count: number; value: number; weightedValue: number }>();
  const monthMap = new Map<string, { count: number; value: number }>();

  for (const d of all) {
    const stage = stageMap.get(d.stage_id);
    if (!stage || stage.is_won || stage.is_lost) continue;

    const value = Number(d.value);
    const prob = d.probability != null ? d.probability / 100 : 0.5;
    totalPipelineValue += value;
    weightedPipelineValue += value * prob;

    if (!byStageMap.has(d.stage_id)) {
      byStageMap.set(d.stage_id, { stage_name: stage.name, count: 0, value: 0, weightedValue: 0 });
    }
    const entry = byStageMap.get(d.stage_id)!;
    entry.count += 1;
    entry.value += value;
    entry.weightedValue += value * prob;

    if (d.expected_close_date) {
      const month = d.expected_close_date.slice(0, 7);
      if (!monthMap.has(month)) monthMap.set(month, { count: 0, value: 0 });
      const m = monthMap.get(month)!;
      m.count += 1;
      m.value += value * prob;
    }
  }

  const byStage = Array.from(byStageMap.entries()).map(([stage_id, v]) => ({
    stage_id,
    stage_name: v.stage_name,
    count: v.count,
    value: v.value,
    weightedValue: Math.round(v.weightedValue * 100) / 100,
  }));

  const expectedCloseByMonth = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, count: v.count, value: Math.round(v.value * 100) / 100 }));

  const result: SalesForecastResult = {
    byStage,
    totalPipelineValue,
    weightedPipelineValue: Math.round(weightedPipelineValue * 100) / 100,
    expectedCloseByMonth,
  };

  return NextResponse.json(apiSuccess(result));
}
