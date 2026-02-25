import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { TaskComment } from "@/lib/supabase/types";

const COMMENT_SELECT = "id, tenant_id, task_id, parent_id, author_id, body, created_at, updated_at";

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
    .from("task_comments")
    .select(COMMENT_SELECT)
    .eq("tenant_id", orgId)
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const comments = (rows ?? []) as (Record<string, unknown> & { author_id: string })[];
  const authorIds = [...new Set(comments.map((c) => c.author_id))];
  const nameMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", authorIds);
    for (const p of profiles ?? []) {
      const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || null;
      nameMap[p.id] = name ?? p.id;
    }
  }
  const result: TaskComment[] = comments.map((r) => ({
    ...r,
    author_name: nameMap[r.author_id] ?? null,
  })) as TaskComment[];

  return NextResponse.json(apiSuccess(result));
}

export type CreateCommentBody = { body: string; parent_id?: string | null };

export async function POST(
  request: Request,
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

  let body: CreateCommentBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const commentBody = typeof body.body === "string" ? body.body.trim() : "";
  if (!commentBody) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "body is required"), { status: 400 });
  }

  const { data: row, error } = await supabase
    .from("task_comments")
    .insert({
      tenant_id: orgId,
      task_id: taskId,
      author_id: user.id,
      body: commentBody,
      parent_id: body.parent_id ?? null,
    })
    .select(COMMENT_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  await supabase.from("task_activities").insert({
    tenant_id: orgId,
    task_id: taskId,
    actor_id: user.id,
    action_type: "comment_added",
    new_values: { comment_id: row.id },
  });

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();
  const author_name = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || null
    : null;
  const comment = { ...row, author_name } as TaskComment;
  return NextResponse.json(apiSuccess(comment), { status: 201 });
}
