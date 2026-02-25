import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { Lead } from "@/lib/supabase/types";

const LEAD_SELECT =
  "id, tenant_id, name, email, phone, company, source, status, notes, metadata, created_at, updated_at";

export interface GetLeadsResult {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
}

const SORT_COLUMNS = ["created_at", "name", "company", "status"] as const;
type SortColumn = (typeof SORT_COLUMNS)[number];

/** GET list of leads. Query: page, pageSize, search, status, source, created_after, created_before, sortBy, order */
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

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 10));
  const search = (searchParams.get("search") ?? "").trim() || undefined;
  const status = (searchParams.get("status") ?? "").trim() || undefined;
  const source = (searchParams.get("source") ?? "").trim() || undefined;
  const createdAfter = (searchParams.get("created_after") ?? "").trim() || undefined;
  const createdBefore = (searchParams.get("created_before") ?? "").trim() || undefined;
  const sortByRaw = (searchParams.get("sortBy") ?? "created_at").trim();
  const sortBy: SortColumn = SORT_COLUMNS.includes(sortByRaw as SortColumn) ? (sortByRaw as SortColumn) : "created_at";
  const order = (searchParams.get("order") ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(apiError(API_ERROR_CODES.UNAUTHORIZED, "Unauthorized"), { status: 401 });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("leads")
    .select(LEAD_SELECT, { count: "exact" })
    .eq("tenant_id", orgId)
    .order(sortBy, { ascending: order === "asc" })
    .range(from, to);

  if (search) {
    const term = `%${search}%`;
    query = query.or(`name.ilike.${term},email.ilike.${term},company.ilike.${term}`);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (source) {
    query = query.eq("source", source);
  }
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

  const items = (rows ?? []) as Lead[];
  const total = count ?? 0;
  return NextResponse.json(apiSuccess<GetLeadsResult>({ items, total, page, pageSize }, total));
}

export type CreateLeadBody = {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source?: string | null;
  status?: string | null;
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

  let body: CreateLeadBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Name is required"), { status: 400 });
  }

  const metadata =
    body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? body.metadata
      : {};
  const insert: Record<string, unknown> = {
    tenant_id: orgId,
    name,
    email: typeof body.email === "string" && body.email.trim() ? body.email.trim() : null,
    phone: typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null,
    company: typeof body.company === "string" && body.company.trim() ? body.company.trim() : null,
    source: typeof body.source === "string" && body.source.trim() ? body.source.trim() : null,
    status: typeof body.status === "string" && body.status.trim() ? body.status.trim() : "new",
    notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
    metadata: Object.keys(metadata).length > 0 ? metadata : {},
  };

  const { data: row, error } = await supabase
    .from("leads")
    .insert(insert)
    .select(LEAD_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess(row as Lead), { status: 201 });
}
