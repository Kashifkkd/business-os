import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { Task } from "@/lib/supabase/types";

const TASK_SELECT =
  "id, tenant_id, space_id, list_id, parent_id, status_id, title, description, priority, due_date, start_date, sort_order, custom_fields, metadata, created_at, updated_at";

const TASK_SELECT_WITH_RELATIONS = `
  id, tenant_id, space_id, list_id, parent_id, status_id, title, description, priority, due_date, start_date, sort_order, custom_fields, metadata, created_at, updated_at,
  task_statuses(name, type),
  task_lists(name)
`;

/** GET tasks. Query: space_id, list_id, status_id, assignee_id, parent_id, search, sortBy, order, page, pageSize, view=list|kanban (kanban returns grouped by status). */
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
  const spaceId = searchParams.get("space_id")?.trim() || undefined;
  const listId = searchParams.get("list_id")?.trim() || undefined;
  const statusId = searchParams.get("status_id")?.trim() || undefined;
  const assigneeId = searchParams.get("assignee_id")?.trim() || undefined;
  const parentId = searchParams.get("parent_id")?.trim() || undefined;
  const search = searchParams.get("search")?.trim() || undefined;
  const sortBy = searchParams.get("sortBy")?.trim() || "sort_order";
  const order = searchParams.get("order")?.toLowerCase() === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));

  if (!spaceId) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "space_id is required"), { status: 400 });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let taskIdFilter: string[] | null = null;
  if (assigneeId) {
    const { data: assigned } = await supabase
      .from("task_assignees")
      .select("task_id")
      .eq("user_id", assigneeId);
    taskIdFilter = (assigned ?? []).map((a: { task_id: string }) => a.task_id);
    if (taskIdFilter.length === 0) {
      return NextResponse.json(apiSuccess({ items: [], total: 0, page, pageSize }, 0));
    }
  }

  let query = supabase
    .from("tasks")
    .select(TASK_SELECT_WITH_RELATIONS, { count: "exact" })
    .eq("tenant_id", orgId)
    .eq("space_id", spaceId)
    .order(sortBy, { ascending: order === "asc" })
    .range(from, to);

  if (taskIdFilter) query = query.in("id", taskIdFilter);
  if (listId) query = query.eq("list_id", listId);
  if (statusId) query = query.eq("status_id", statusId);
  if (parentId !== undefined) {
    if (parentId === "" || parentId === "null") {
      query = query.is("parent_id", null);
    } else {
      query = query.eq("parent_id", parentId);
    }
  }
  if (search) {
    const term = `%${search}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term}`);
  }

  const { data: rows, error, count } = await query;

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const items = normalizeTasks(rows ?? []);
  const total = count ?? 0;
  return NextResponse.json(apiSuccess({ items, total, page, pageSize }, total));
}

function normalizeTasks(rows: Record<string, unknown>[]): Task[] {
  return rows.map((r) => {
    const statuses = r.task_statuses as { name?: string; type?: string } | null;
    const lists = r.task_lists as { name?: string } | null;
    const { task_statuses, task_lists, ...rest } = r;
    return {
      ...rest,
      status_name: statuses?.name ?? null,
      status_type: statuses?.type ?? null,
      list_name: lists?.name ?? null,
    } as Task;
  });
}

export type CreateTaskBody = {
  space_id: string;
  list_id: string;
  parent_id?: string | null;
  status_id?: string | null;
  title: string;
  description?: string | null;
  priority?: "urgent" | "high" | "medium" | "low" | "none";
  due_date?: string | null;
  start_date?: string | null;
  sort_order?: number;
  assignee_ids?: string[];
};

/** POST create a task. Ensures space/list belong to org; uses first org status if status_id not provided. */
export async function POST(
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

  let body: CreateTaskBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const spaceId = typeof body.space_id === "string" ? body.space_id.trim() : "";
  const listId = typeof body.list_id === "string" ? body.list_id.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!spaceId || !listId) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "space_id and list_id are required"), { status: 400 });
  }
  if (!title) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "title is required"), { status: 400 });
  }

  const { data: spaceRow } = await supabase
    .from("task_spaces")
    .select("id")
    .eq("tenant_id", orgId)
    .eq("id", spaceId)
    .single();
  if (!spaceRow) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Space not found"), { status: 404 });
  }

  const { data: listRow } = await supabase
    .from("task_lists")
    .select("id, space_id")
    .eq("id", listId)
    .eq("space_id", spaceId)
    .single();
  if (!listRow) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "List not found"), { status: 404 });
  }

  let statusId = typeof body.status_id === "string" && body.status_id.trim() ? body.status_id.trim() : null;
  if (!statusId) {
    const { data: statusRow } = await supabase
      .from("task_statuses")
      .select("id")
      .eq("tenant_id", orgId)
      .or(`space_id.eq.${spaceId},space_id.is.null`)
      .order("sort_order", { ascending: true })
      .limit(1)
      .single();
    statusId = statusRow?.id ?? null;
  }
  if (!statusId) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "No status available for this space"), { status: 400 });
  }

  const priority = body.priority && ["urgent", "high", "medium", "low", "none"].includes(body.priority) ? body.priority : "none";

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      tenant_id: orgId,
      space_id: spaceId,
      list_id: listId,
      parent_id: body.parent_id ?? null,
      status_id: statusId,
      title,
      description: typeof body.description === "string" && body.description.trim() ? body.description.trim() : null,
      priority,
      due_date: body.due_date && typeof body.due_date === "string" ? body.due_date : null,
      start_date: body.start_date && typeof body.start_date === "string" ? body.start_date : null,
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
    })
    .select(TASK_SELECT)
    .single();

  if (taskError || !task) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, taskError?.message ?? "Failed to create task"), { status: 400 });
  }

  const assigneeIds = Array.isArray(body.assignee_ids) ? body.assignee_ids.filter((id): id is string => typeof id === "string") : [];
  if (assigneeIds.length > 0) {
    await supabase.from("task_assignees").insert(
      assigneeIds.map((user_id) => ({ task_id: task.id, user_id }))
    );
  }

  const { data: activityError } = await supabase.from("task_activities").insert({
    tenant_id: orgId,
    task_id: task.id,
    actor_id: user.id,
    action_type: "created",
    new_values: { title: task.title },
  });
  if (activityError) {
    // non-fatal
  }

  const fullTask = await fetchTaskWithRelations(supabase, task.id);
  return NextResponse.json(apiSuccess(fullTask ?? (task as Task)), { status: 201 });
}

async function fetchTaskWithRelations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string
): Promise<Task | null> {
  const { data: row } = await supabase
    .from("tasks")
    .select(TASK_SELECT_WITH_RELATIONS)
    .eq("id", taskId)
    .single();
  if (!row) return null;
  const statuses = row.task_statuses as { name?: string; type?: string } | null;
  const lists = row.task_lists as { name?: string } | null;
  const { task_statuses, task_lists, ...rest } = row;
  const task: Task = {
    ...rest,
    status_name: statuses?.name ?? null,
    status_type: statuses?.type ?? null,
    list_name: lists?.name ?? null,
  } as Task;
  const { data: assignees } = await supabase.from("task_assignees").select("user_id").eq("task_id", taskId);
  task.assignee_ids = (assignees ?? []).map((a: { user_id: string }) => a.user_id);
  return task;
}
