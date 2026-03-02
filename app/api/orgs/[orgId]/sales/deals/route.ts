import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { Deal } from "@/lib/supabase/types";

const DEAL_SELECT =
  "id, tenant_id, name, lead_id, stage_id, owner_id, value, actual_value, probability, expected_close_date, close_date, notes, metadata, created_at, updated_at";

const SORT_COLUMNS = ["created_at", "updated_at", "name", "value", "expected_close_date"] as const;
type SortColumn = (typeof SORT_COLUMNS)[number];

export interface GetDealsResult {
  items: Deal[];
  total: number;
  page: number;
  pageSize: number;
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

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 10));
  const search = (searchParams.get("search") ?? "").trim() || undefined;
  const stageId = (searchParams.get("stage_id") ?? "").trim() || undefined;
  const ownerId = (searchParams.get("owner_id") ?? "").trim() || undefined;
  const leadId = (searchParams.get("lead_id") ?? "").trim() || undefined;
  const createdAfter = (searchParams.get("created_after") ?? "").trim() || undefined;
  const createdBefore = (searchParams.get("created_before") ?? "").trim() || undefined;
  const sortByRaw = (searchParams.get("sortBy") ?? "created_at").trim();
  const sortBy: SortColumn = SORT_COLUMNS.includes(sortByRaw as SortColumn) ? (sortByRaw as SortColumn) : "created_at";
  const order = (searchParams.get("order") ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("deals")
    .select(DEAL_SELECT, { count: "exact" })
    .eq("tenant_id", orgId)
    .order(sortBy, { ascending: order === "asc" })
    .range(from, to);

  if (search) {
    const term = `%${search}%`;
    query = query.ilike("name", term);
  }
  if (stageId) query = query.eq("stage_id", stageId);
  if (ownerId) query = query.eq("owner_id", ownerId);
  if (leadId) query = query.eq("lead_id", leadId);
  if (createdAfter) {
    const fromDate = createdAfter.includes("T") ? createdAfter : `${createdAfter}T00:00:00.000Z`;
    query = query.gte("created_at", fromDate);
  }
  if (createdBefore) {
    const toDate = createdBefore.includes("T") ? createdBefore : `${createdBefore}T23:59:59.999Z`;
    query = query.lte("created_at", toDate);
  }

  const { data: rows, error, count } = await query;

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const items = (rows ?? []).map((r) => ({
    ...r,
    value: Number(r.value),
    actual_value: r.actual_value != null ? Number(r.actual_value) : null,
    probability: r.probability != null ? Number(r.probability) : null,
  })) as Deal[];
  const total = count ?? 0;
  return NextResponse.json(apiSuccess<GetDealsResult>({ items, total, page, pageSize }, total));
}

export type CreateDealBody = {
  name: string;
  lead_id?: string | null;
  stage_id: string;
  owner_id?: string | null;
  value?: number;
  actual_value?: number | null;
  probability?: number | null;
  expected_close_date?: string | null;
  close_date?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
};

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

  let body: CreateDealBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Name is required"), { status: 400 });
  }

  const stageId = typeof body.stage_id === "string" ? body.stage_id.trim() : "";
  if (!stageId) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Stage is required"), { status: 400 });
  }

  const { data: stageRow } = await supabase
    .from("sales_pipeline_stages")
    .select("id")
    .eq("tenant_id", orgId)
    .eq("id", stageId)
    .single();
  if (!stageRow) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid stage"), { status: 400 });
  }

  const metadata =
    body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? body.metadata
      : {};
  const insert: Record<string, unknown> = {
    tenant_id: orgId,
    name,
    stage_id: stageId,
    lead_id: typeof body.lead_id === "string" && body.lead_id.trim() ? body.lead_id.trim() : null,
    owner_id: typeof body.owner_id === "string" && body.owner_id.trim() ? body.owner_id.trim() : null,
    value: typeof body.value === "number" && body.value >= 0 ? body.value : 0,
    actual_value: typeof body.actual_value === "number" ? body.actual_value : null,
    probability:
      typeof body.probability === "number" && body.probability >= 0 && body.probability <= 100
        ? body.probability
        : null,
    expected_close_date: typeof body.expected_close_date === "string" && body.expected_close_date.trim() ? body.expected_close_date.trim() : null,
    close_date: typeof body.close_date === "string" && body.close_date.trim() ? body.close_date.trim() : null,
    notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
    metadata: Object.keys(metadata).length > 0 ? metadata : {},
  };

  const { data: row, error } = await supabase
    .from("deals")
    .insert(insert)
    .select(DEAL_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const deal = {
    ...row,
    value: Number(row.value),
    actual_value: row.actual_value != null ? Number(row.actual_value) : null,
    probability: row.probability != null ? Number(row.probability) : null,
  } as Deal;
  return NextResponse.json(apiSuccess(deal), { status: 201 });
}
