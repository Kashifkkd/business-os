import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { TaskActivity } from "@/lib/supabase/types";

const ACTIVITY_SELECT =
  "id, tenant_id, task_id, actor_id, action_type, old_values, new_values, created_at";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; taskId: string }> }
) {
  const { orgId, taskId } = await params;
  if (!orgId || !taskId) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId or taskId"), { status: 400 });
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

  const { data: taskRow } = await supabase
    .from("tasks")
    .select("id")
    .eq("tenant_id", orgId)
    .eq("id", taskId)
    .single();

  if (!taskRow) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Task not found"), { status: 404 });
  }

  const { data: rows, error } = await supabase
    .from("task_activities")
    .select(ACTIVITY_SELECT)
    .eq("tenant_id", orgId)
    .eq("task_id", taskId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const activities = (rows ?? []) as (Record<string, unknown> & { actor_id: string | null })[];
  const actorIds = [...new Set(activities.map((a) => a.actor_id).filter(Boolean))] as string[];
  const nameMap: Record<string, string> = {};
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", actorIds);
    for (const p of profiles ?? []) {
      const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || null;
      nameMap[p.id] = name ?? p.id;
    }
  }
  const result: TaskActivity[] = activities.map((r) => ({
    ...r,
    actor_name: r.actor_id ? nameMap[r.actor_id] ?? null : null,
  })) as TaskActivity[];

  return NextResponse.json(apiSuccess(result));
}
