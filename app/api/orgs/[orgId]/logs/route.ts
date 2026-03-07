import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export type ActivityLogRow = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  creator?: {
    id: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
};

export type GetLogsResult = {
  items: ActivityLogRow[];
  nextCursor?: string;
};

function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(JSON.stringify({ created_at: createdAt, id }), "utf-8").toString("base64url");
}

function decodeCursor(cursor: string): { created_at: string; id: string } | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf-8");
    const parsed = JSON.parse(raw) as { created_at?: string; id?: string };
    if (typeof parsed?.created_at === "string" && typeof parsed?.id === "string") {
      return { created_at: parsed.created_at, id: parsed.id };
    }
  } catch {
    // ignore
  }
  return null;
}

/** GET activity logs. Query: cursor, limit, from, to, action, entity_type, user_id */
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
  const cursor = (searchParams.get("cursor") ?? "").trim() || undefined;
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT));
  const from = (searchParams.get("from") ?? "").trim() || undefined;
  const to = (searchParams.get("to") ?? "").trim() || undefined;
  const action = (searchParams.get("action") ?? "").trim() || undefined;
  const entityType = (searchParams.get("entity_type") ?? "").trim() || undefined;
  const userId = (searchParams.get("user_id") ?? "").trim() || undefined;

  let query = supabase
    .from("activity_logs")
    .select("id, user_id, action, entity_type, entity_id, description, metadata, created_at")
    .eq("tenant_id", orgId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (from) {
    const fromDate = from.includes("T") ? from : `${from}T00:00:00.000Z`;
    query = query.gte("created_at", fromDate);
  }
  if (to) {
    const toDate = to.includes("T") ? to : `${to}T23:59:59.999Z`;
    query = query.lte("created_at", toDate);
  }
  if (action) {
    query = query.eq("action", action);
  }
  if (entityType) {
    query = query.eq("entity_type", entityType);
  }
  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      const c = decoded.created_at.replace(/"/g, '\\"');
      const i = decoded.id.replace(/"/g, '\\"');
      query = query.or(`created_at.lt."${c}",and(created_at.eq."${c}",id.lt."${i}")`);
    }
  }

  const { data: rows, error } = await query;

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const list = rows ?? [];
  const hasMore = list.length > limit;
  const items = hasMore ? list.slice(0, limit) : list;

  const creatorIds = [...new Set(items.map((r) => r.user_id).filter(Boolean))] as string[];
  let creatorMap: Record<
    string,
    { id: string; name: string | null; email: string | null; avatar_url: string | null }
  > = {};
  if (creatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, avatar_url")
      .in("id", creatorIds);
    if (profiles?.length) {
      for (const p of profiles) {
        const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || null;
        creatorMap[p.id] = {
          id: p.id,
          name,
          email: p.email ?? null,
          avatar_url: p.avatar_url ?? null,
        };
      }
    }
  }

  const result: ActivityLogRow[] = items.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    description: row.description,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: row.created_at,
    creator: row.user_id ? creatorMap[row.user_id] ?? null : null,
  }));

  let nextCursor: string | undefined;
  if (hasMore && result.length > 0) {
    const last = result[result.length - 1];
    nextCursor = encodeCursor(last.created_at, last.id);
  }

  return NextResponse.json(apiSuccess<GetLogsResult>({ items: result, nextCursor }));
}
