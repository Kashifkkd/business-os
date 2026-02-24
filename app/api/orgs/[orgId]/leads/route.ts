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

/** GET list of leads. Query: page, pageSize, search, status */
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
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    const term = `%${search}%`;
    query = query.or(`name.ilike.${term},email.ilike.${term},company.ilike.${term}`);
  }
  if (status) {
    query = query.eq("status", status);
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

  const insert: Record<string, unknown> = {
    tenant_id: orgId,
    name,
    email: typeof body.email === "string" && body.email.trim() ? body.email.trim() : null,
    phone: typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null,
    company: typeof body.company === "string" && body.company.trim() ? body.company.trim() : null,
    source: typeof body.source === "string" && body.source.trim() ? body.source.trim() : null,
    status: typeof body.status === "string" && body.status.trim() ? body.status.trim() : "new",
    notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
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
