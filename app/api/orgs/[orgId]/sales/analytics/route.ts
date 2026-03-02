import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";

export interface SalesAnalyticsResult {
  winRate: number | null;
  lossRate: number | null;
  avgDealValue: number;
  totalWonValue: number;
  totalLostCount: number;
  stageConversion: { from_stage: string; to_stage: string; count: number }[];
  dealsCreatedByMonth: { month: string; count: number; value: number }[];
  dealsClosedByMonth: { month: string; won: number; lost: number; wonValue: number }[];
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
    .select("id, name, is_won, is_lost")
    .eq("tenant_id", orgId);

  const stageMap = new Map((stages ?? []).map((s) => [s.id, s]));

  const { data: deals, error } = await supabase
    .from("deals")
    .select("id, stage_id, value, actual_value, created_at, close_date")
    .eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const items = (deals ?? []) as {
    id: string;
    stage_id: string;
    value: string;
    actual_value: string | null;
    created_at: string;
    close_date: string | null;
  }[];

  let totalWonValue = 0;
  let wonCount = 0;
  let lostCount = 0;
  let totalValue = 0;
  const createdByMonth = new Map<string, { count: number; value: number }>();
  const closedByMonth = new Map<string, { won: number; lost: number; wonValue: number }>();

  for (const d of items) {
    const stage = stageMap.get(d.stage_id);
    const value = Number(d.value);
    const actualValue = d.actual_value != null ? Number(d.actual_value) : null;
    totalValue += value;

    const createdMonth = d.created_at.slice(0, 7);
    if (!createdByMonth.has(createdMonth)) createdByMonth.set(createdMonth, { count: 0, value: 0 });
    const cm = createdByMonth.get(createdMonth)!;
    cm.count += 1;
    cm.value += value;

    if (stage?.is_won) {
      wonCount += 1;
      const v = actualValue != null ? actualValue : value;
      totalWonValue += v;
      const closeMonth = (d.close_date || d.created_at).slice(0, 7);
      if (!closedByMonth.has(closeMonth)) closedByMonth.set(closeMonth, { won: 0, lost: 0, wonValue: 0 });
      closedByMonth.get(closeMonth)!.won += 1;
      closedByMonth.get(closeMonth)!.wonValue += v;
    } else if (stage?.is_lost) {
      lostCount += 1;
      const closeMonth = (d.close_date || d.created_at).slice(0, 7);
      if (!closedByMonth.has(closeMonth)) closedByMonth.set(closeMonth, { won: 0, lost: 0, wonValue: 0 });
      closedByMonth.get(closeMonth)!.lost += 1;
    }
  }

  const closedTotal = wonCount + lostCount;
  const winRate = closedTotal > 0 ? (wonCount / closedTotal) * 100 : null;
  const lossRate = closedTotal > 0 ? (lostCount / closedTotal) * 100 : null;
  const avgDealValue = items.length > 0 ? totalValue / items.length : 0;

  const dealsCreatedByMonth = Array.from(createdByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, count: v.count, value: Math.round(v.value * 100) / 100 }));

  const dealsClosedByMonth = Array.from(closedByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      won: v.won,
      lost: v.lost,
      wonValue: Math.round(v.wonValue * 100) / 100,
    }));

  const result: SalesAnalyticsResult = {
    winRate,
    lossRate,
    avgDealValue: Math.round(avgDealValue * 100) / 100,
    totalWonValue: Math.round(totalWonValue * 100) / 100,
    totalLostCount: lostCount,
    stageConversion: [],
    dealsCreatedByMonth,
    dealsClosedByMonth,
  };

  return NextResponse.json(apiSuccess(result));
}
