import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import { createActivityLog, ACTIONS, ENTITY_TYPES } from "@/lib/activity-log";
import type { LeadStageItem } from "@/lib/lead-stages";
import { normalizeStageColor } from "@/lib/lead-stages";

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
  const { data: rows, error } = await supabase
    .from("lead_stages")
    .select("id, tenant_id, name, color, sort_order, is_default, created_at, updated_at")
    .eq("tenant_id", orgId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const stages: LeadStageItem[] = (rows ?? []).map((r) => ({
    id: r.id,
    name: String(r.name ?? "").trim(),
    color: normalizeStageColor(r.color),
    sort_order: r.sort_order,
    is_default: !!r.is_default,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  return NextResponse.json(apiSuccess({ stages }));
}

export async function PATCH(
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

  let body: { stages?: Array<{ id?: string; name: string; color?: string; sort_order?: number; is_default?: boolean }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const rawList = Array.isArray(body.stages) ? body.stages : [];
  const stages: Array<{ id?: string; name: string; color: string; sort_order: number; is_default: boolean }> = rawList
    .filter((s): s is { id?: string; name: string; color?: string; sort_order?: number; is_default?: boolean } => s && typeof s === "object" && typeof s.name === "string" && s.name.trim() !== "")
    .map((s, i) => ({
      id: typeof s.id === "string" ? s.id : undefined,
      name: s.name.trim(),
      color: normalizeStageColor(s.color),
      sort_order: typeof s.sort_order === "number" ? s.sort_order : i,
      is_default: !!s.is_default,
    }));

  const hasDefault = stages.some((s) => s.is_default);
  if (!hasDefault && stages.length > 0) {
    stages[0].is_default = true;
  }

  const existingRows = await supabase.from("lead_stages").select("id").eq("tenant_id", orgId);
  const existingIds = new Set((existingRows.data ?? []).map((r) => r.id));

  const defaultIndex = stages.findIndex((s) => s.is_default);
  const wantDefaultAtIndex = defaultIndex >= 0 ? defaultIndex : 0;

  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    if (s.id && existingIds.has(s.id)) {
      const { error: updateError } = await supabase
        .from("lead_stages")
        .update({ name: s.name, color: s.color, sort_order: i, is_default: false })
        .eq("id", s.id)
        .eq("tenant_id", orgId);
      if (updateError) {
        return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, updateError.message), { status: 400 });
      }
    } else {
      const { error: insertError } = await supabase.from("lead_stages").insert({
        tenant_id: orgId,
        name: s.name,
        color: s.color,
        sort_order: i,
        is_default: false,
      });
      if (insertError) {
        return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, insertError.message), { status: 400 });
      }
    }
  }

  const keptIds = new Set(stages.map((s) => s.id).filter(Boolean) as string[]);
  const toDelete = [...existingIds].filter((id) => !keptIds.has(id));
  if (toDelete.length > 0) {
    const { data: afterStages } = await supabase
      .from("lead_stages")
      .select("id, sort_order")
      .eq("tenant_id", orgId)
      .order("sort_order", { ascending: true });
    const defaultId = (afterStages ?? [])[wantDefaultAtIndex]?.id ?? (afterStages ?? [])[0]?.id;
    if (defaultId) {
      await supabase.from("leads").update({ stage_id: defaultId }).eq("tenant_id", orgId).in("stage_id", toDelete);
    }
    await supabase.from("lead_stages").delete().in("id", toDelete).eq("tenant_id", orgId);
  }

  let { data: updated } = await supabase
    .from("lead_stages")
    .select("id, name, color, sort_order, is_default, created_at, updated_at")
    .eq("tenant_id", orgId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const defaultId = (updated ?? [])[wantDefaultAtIndex]?.id ?? (updated ?? [])[0]?.id;
  if (defaultId) {
    await supabase.from("lead_stages").update({ is_default: false }).eq("tenant_id", orgId).neq("id", defaultId);
    await supabase.from("lead_stages").update({ is_default: true }).eq("id", defaultId).eq("tenant_id", orgId);
    const { data: refreshed } = await supabase
      .from("lead_stages")
      .select("id, name, color, sort_order, is_default, created_at, updated_at")
      .eq("tenant_id", orgId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    updated = refreshed ?? updated;
  }

  const result: LeadStageItem[] = (updated ?? []).map((r) => ({
    id: r.id,
    name: String(r.name ?? "").trim(),
    color: normalizeStageColor(r.color),
    sort_order: r.sort_order,
    is_default: !!r.is_default,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  await createActivityLog(supabase, {
    tenantId: orgId,
    userId: user.id,
    action: ACTIONS.UPDATE,
    resourceType: ENTITY_TYPES.LEAD_SOURCE,
    description: "Updated lead stages",
    metadata: {},
  });

  return NextResponse.json(apiSuccess({ stages: result }));
}
