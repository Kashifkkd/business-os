import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";

export interface LeadsStatsResult {
  total: number;
  byStage: { stage_id: string; stage_name: string; count: number }[];
  bySource: { source: string; count: number }[];
  overTime: { date: string; count: number }[];
  newThisWeek: number;
}

/** GET leads stats for insights: total, byStage, bySource, overTime (last 30 days), newThisWeek */
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

  const { data: all, error: listError } = await supabase
    .from("leads")
    .select("id, stage_id, source, created_at")
    .eq("tenant_id", orgId);

  if (listError) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, listError.message), { status: 400 });
  }

  const items = (all ?? []) as { id: string; stage_id: string; source: string | null; created_at: string }[];
  const total = items.length;

  const stageIds = [...new Set(items.map((r) => r.stage_id).filter(Boolean))];
  const { data: stagesRows } =
    stageIds.length > 0
      ? await supabase.from("lead_stages").select("id, name").in("id", stageIds)
      : { data: [] };
  const stageNameById: Record<string, string> = {};
  (stagesRows ?? []).forEach((s: { id: string; name: string }) => {
    stageNameById[s.id] = s.name;
  });

  const stageCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  let newThisWeek = 0;
  const dayCounts: Record<string, number> = {};
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    dayCounts[d.toISOString().slice(0, 10)] = 0;
  }

  for (const row of items) {
    stageCounts[row.stage_id] = (stageCounts[row.stage_id] ?? 0) + 1;
    const src = row.source?.trim() || "Unknown";
    sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
    if (new Date(row.created_at) >= weekAgo) newThisWeek++;
    const day = row.created_at.slice(0, 10);
    if (day in dayCounts) dayCounts[day]++;
  }

  const byStage = Object.entries(stageCounts).map(([stage_id, count]) => ({
    stage_id,
    stage_name: stageNameById[stage_id] ?? "",
    count,
  }));
  const bySource = Object.entries(sourceCounts).map(([source, count]) => ({ source, count }));
  const overTime = Object.entries(dayCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const result: LeadsStatsResult = {
    total,
    byStage,
    bySource,
    overTime,
    newThisWeek,
  };

  return NextResponse.json(apiSuccess(result));
}
