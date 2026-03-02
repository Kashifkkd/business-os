import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { Task } from "@/lib/supabase/types";

const TASK_SELECT =
  "id, tenant_id, space_id, list_id, parent_id, status_id, title, description, priority, due_date, start_date, sort_order, custom_fields, metadata, created_at, updated_at";

const TASK_SELECT_WITH_RELATIONS = `
  id, tenant_id, space_id, list_id, parent_id, status_id, title, description, priority, due_date, start_date, sort_order, custom_fields, metadata, created_at, updated_at,
  task_statuses(name, type, color),
  task_lists(name),
  task_spaces(name)
`;

async function getTaskWithRelations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string
): Promise<Task | null> {
  const { data: row } = await supabase
    .from("tasks")
    .select(TASK_SELECT_WITH_RELATIONS)
    .eq("id", taskId)
    .single();
  if (!row) return null;
  const statuses = row.task_statuses as { name?: string; type?: string; color?: string | null } | null;
  const lists = row.task_lists as { name?: string } | null;
  const spaces = row.task_spaces as { name?: string } | null;
  const { task_statuses, task_lists, task_spaces, ...rest } = row;
  const task: Task = {
    ...rest,
    status_name: statuses?.name ?? null,
    status_type: statuses?.type ?? null,
    status_color: statuses?.color ?? null,
    list_name: lists?.name ?? null,
    space_name: spaces?.name ?? null,
  } as Task;
  const { data: assignees } = await supabase.from("task_assignees").select("user_id").eq("task_id", taskId);
  task.assignee_ids = (assignees ?? []).map((a: { user_id: string }) => a.user_id);
  const { data: taskLabelRows } = await supabase
    .from("task_task_labels")
    .select("label_id")
    .eq("task_id", taskId);
  const labelIds = (taskLabelRows ?? []).map((r: { label_id: string }) => r.label_id);
  if (labelIds.length > 0) {
    const { data: labels } = await supabase
      .from("task_labels")
      .select("id, tenant_id, space_id, name, color, sort_order, created_at, updated_at")
      .in("id", labelIds);
    task.label_ids = labelIds;
    task.labels = labels ?? [];
  }
  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", taskId);
  task.subtask_count = count ?? 0;
  return task;
}

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

  const task = await getTaskWithRelations(supabase, taskId);
  if (!task) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Task not found"), { status: 404 });
  }

  return NextResponse.json(apiSuccess(task));
}

export type UpdateTaskBody = Partial<{
  list_id: string;
  parent_id: string | null;
  status_id: string;
  title: string;
  description: string | null;
  priority: "urgent" | "high" | "medium" | "low" | "none";
  due_date: string | null;
  start_date: string | null;
  sort_order: number;
  custom_fields: Record<string, unknown>;
  assignee_ids: string[];
  label_ids: string[];
}>;

export async function PATCH(
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

  const { data: existing, error: fetchError } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("tenant_id", orgId)
    .eq("id", taskId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Task not found"), { status: 404 });
  }

  let body: UpdateTaskBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (body.list_id !== undefined) payload.list_id = body.list_id;
  if (body.parent_id !== undefined) payload.parent_id = body.parent_id;
  if (body.status_id !== undefined) payload.status_id = body.status_id;
  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (!t) {
      return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Title cannot be empty"), { status: 400 });
    }
    payload.title = t;
  }
  if (body.description !== undefined) payload.description = body.description;
  if (body.priority !== undefined && ["urgent", "high", "medium", "low", "none"].includes(body.priority)) {
    payload.priority = body.priority;
  }
  if (body.due_date !== undefined) payload.due_date = body.due_date;
  if (body.start_date !== undefined) payload.start_date = body.start_date;
  if (typeof body.sort_order === "number") payload.sort_order = body.sort_order;
  if (body.custom_fields !== undefined && typeof body.custom_fields === "object") payload.custom_fields = body.custom_fields;

  if (payload.status_id && payload.status_id !== existing.status_id) {
    await supabase.from("task_activities").insert({
      tenant_id: orgId,
      task_id: taskId,
      actor_id: user.id,
      action_type: "status_changed",
      old_values: { status_id: existing.status_id },
      new_values: { status_id: payload.status_id },
    });
  }

  if (Object.keys(payload).length > 0) {
    const { error: updateError } = await supabase
      .from("tasks")
      .update(payload)
      .eq("id", taskId)
      .eq("tenant_id", orgId);
    if (updateError) {
      return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, updateError.message), { status: 400 });
    }
  }

  if (Array.isArray(body.assignee_ids)) {
    await supabase.from("task_assignees").delete().eq("task_id", taskId);
    const ids = body.assignee_ids.filter((id): id is string => typeof id === "string");
    if (ids.length > 0) {
      await supabase.from("task_assignees").insert(ids.map((user_id) => ({ task_id: taskId, user_id })));
    }
  }

  if (Array.isArray(body.label_ids)) {
    await supabase.from("task_task_labels").delete().eq("task_id", taskId);
    const ids = body.label_ids.filter((id): id is string => typeof id === "string");
    if (ids.length > 0) {
      await supabase.from("task_task_labels").insert(ids.map((label_id) => ({ task_id: taskId, label_id })));
    }
  }

  const task = await getTaskWithRelations(supabase, taskId);
  return NextResponse.json(apiSuccess(task ?? (existing as Task)));
}

export async function DELETE(
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

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess({ deleted: true }));
}
