import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import { createActivityLog, ACTIONS, ENTITY_TYPES } from "@/lib/activity-log";
import type { LeadSourceItem } from "@/lib/lead-sources";
import { DEFAULT_SOURCE_COLOR, normalizeSourceColor } from "@/lib/lead-sources";

const DEFAULT_SOURCE_NAMES = ["website", "referral", "manual", "cold_outbound"];

const FALLBACK_SOURCES: LeadSourceItem[] = DEFAULT_SOURCE_NAMES.map((name) => ({
  name,
  color: DEFAULT_SOURCE_COLOR,
}));

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
    .from("lead_sources")
    .select("id, name, color, sort_order, created_at, created_by")
    .eq("tenant_id", orgId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const list = rows ?? [];
  const creatorIds = [...new Set(list.map((r) => r.created_by).filter(Boolean))] as string[];
  const creatorMap: Record<string, { id: string; name: string | null; email: string | null; avatar_url: string | null }> = {};
  if (creatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, avatar_url")
      .in("id", creatorIds);
    if (profiles?.length) {
      for (const p of profiles) {
        const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || null;
        creatorMap[p.id] = { id: p.id, name, email: p.email ?? null, avatar_url: p.avatar_url ?? null };
      }
    }
  }

  const sources: LeadSourceItem[] =
    list.length > 0
      ? list.map((r) => ({
          id: r.id,
          name: String(r.name ?? "").trim(),
          color: normalizeSourceColor(r.color),
          created_at: r.created_at,
          created_by: r.created_by
            ? creatorMap[r.created_by] ?? { id: r.created_by, name: null, email: null, avatar_url: null }
            : null,
        }))
      : FALLBACK_SOURCES;

  return NextResponse.json(apiSuccess({ sources }));
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

  let body: { sources?: LeadSourceItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const rawList = Array.isArray(body.sources) ? body.sources : [];
  const sources: LeadSourceItem[] = rawList
    .map((s: string | LeadSourceItem): LeadSourceItem | null => {
      if (typeof s === "string") {
        const name = s.trim();
        return name ? { name, color: DEFAULT_SOURCE_COLOR } : null;
      }
      if (s && typeof s === "object" && "name" in s) {
        const name = String(s.name).trim();
        const color = "color" in s && typeof s.color === "string" ? s.color : DEFAULT_SOURCE_COLOR;
        const id = "id" in s && typeof s.id === "string" ? s.id : undefined;
        return name ? { ...(id ? { id } : {}), name, color: normalizeSourceColor(color) } : null;
      }
      return null;
    })
    .filter((x): x is LeadSourceItem => x !== null);

  const existingIds = new Set(
    (await supabase.from("lead_sources").select("id").eq("tenant_id", orgId)).data?.map((r) => r.id) ?? []
  );

  for (let i = 0; i < sources.length; i++) {
    const s = sources[i];
    if (s.id && existingIds.has(s.id)) {
      const { error: updateError } = await supabase
        .from("lead_sources")
        .update({ name: s.name, color: s.color, sort_order: i })
        .eq("id", s.id)
        .eq("tenant_id", orgId);
      if (updateError) {
        return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, updateError.message), { status: 400 });
      }
    } else {
      const { error: insertError } = await supabase.from("lead_sources").insert({
        tenant_id: orgId,
        name: s.name,
        color: s.color,
        sort_order: i,
        created_by: user.id,
      });
      if (insertError) {
        return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, insertError.message), { status: 400 });
      }
    }
  }

  const keptIds = new Set(sources.map((s) => s.id).filter(Boolean) as string[]);
  const toDelete = [...existingIds].filter((id) => !keptIds.has(id));
  if (toDelete.length > 0) {
    await supabase.from("lead_sources").delete().in("id", toDelete).eq("tenant_id", orgId);
  }

  const { data: updated } = await supabase
    .from("lead_sources")
    .select("id, name, color, sort_order, created_at, created_by")
    .eq("tenant_id", orgId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const updatedList = updated ?? [];
  const creatorIds = [...new Set(updatedList.map((r) => r.created_by).filter(Boolean))] as string[];
  const creatorMap: Record<string, { id: string; name: string | null; email: string | null; avatar_url: string | null }> = {};
  if (creatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, avatar_url")
      .in("id", creatorIds);
    if (profiles?.length) {
      for (const p of profiles) {
        const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || null;
        creatorMap[p.id] = { id: p.id, name, email: p.email ?? null, avatar_url: p.avatar_url ?? null };
      }
    }
  }

  const result: LeadSourceItem[] = updatedList.map((r) => ({
    id: r.id,
    name: String(r.name ?? "").trim(),
    color: normalizeSourceColor(r.color),
    created_at: r.created_at,
    created_by: r.created_by
      ? creatorMap[r.created_by] ?? { id: r.created_by, name: null, email: null, avatar_url: null }
      : null,
  }));

  await createActivityLog(supabase, {
    tenantId: orgId,
    userId: user.id,
    action: ACTIONS.UPDATE,
    resourceType: ENTITY_TYPES.LEAD_SOURCE,
    description: "Updated lead sources",
    metadata: {},
  });

  return NextResponse.json(apiSuccess({ sources: result }));
}
