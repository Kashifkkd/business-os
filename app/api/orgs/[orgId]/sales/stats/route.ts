import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";

export interface SalesStatsResult {
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalPipelineValue: number;
  wonValue: number;
  winRate: number | null;
  newThisWeek: number;
  byStage: { stage_id: string; stage_name: string; count: number; value: number }[];
}

export async function GET(
  _request: Request,
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
    .select("id, name, is_won, is_lost")
    .eq("tenant_id", orgId)
    .order("sort_order", { ascending: true });

  const stageMap = new Map((stages ?? []).map((s) => [s.id, s]));

  const { data: deals, error } = await supabase
    .from("deals")
    .select("id, stage_id, value, actual_value, created_at")
    .eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const items = (deals ?? []) as { id: string; stage_id: string; value: string; actual_value: string | null; created_at: string }[];
  const totalDeals = items.length;

  let openDeals = 0;
  let wonDeals = 0;
  let lostDeals = 0;
  let totalPipelineValue = 0;
  let wonValue = 0;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  let newThisWeek = 0;
  const byStageMap = new Map<string, { stage_name: string; count: number; value: number }>();

  for (const d of items) {
    const stage = stageMap.get(d.stage_id);
    const value = Number(d.value);
    const actualValue = d.actual_value != null ? Number(d.actual_value) : null;

    if (stage) {
      if (!byStageMap.has(d.stage_id)) {
        byStageMap.set(d.stage_id, { stage_name: stage.name, count: 0, value: 0 });
      }
      const entry = byStageMap.get(d.stage_id)!;
      entry.count += 1;
      entry.value += stage.is_won && actualValue != null ? actualValue : value;
    }

    if (stage?.is_won) {
      wonDeals += 1;
      wonValue += actualValue != null ? actualValue : value;
    } else if (stage?.is_lost) {
      lostDeals += 1;
    } else {
      openDeals += 1;
      totalPipelineValue += value;
    }

    if (new Date(d.created_at) >= weekAgo) newThisWeek += 1;
  }

  const closedCount = wonDeals + lostDeals;
  const winRate = closedCount > 0 ? (wonDeals / closedCount) * 100 : null;

  const byStage = Array.from(byStageMap.entries()).map(([stage_id, v]) => ({
    stage_id,
    stage_name: v.stage_name,
    count: v.count,
    value: v.value,
  }));

  const result: SalesStatsResult = {
    totalDeals,
    openDeals,
    wonDeals,
    lostDeals,
    totalPipelineValue,
    wonValue,
    winRate,
    newThisWeek,
    byStage,
  };

  return NextResponse.json(apiSuccess(result));
}
