import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { MarketingSegment } from "@/lib/supabase/types";

const SEGMENT_SELECT =
  "id, tenant_id, name, description, definition, estimated_count, created_at, updated_at";

export interface GetMarketingSegmentsResult {
  items: MarketingSegment[];
  total: number;
  page: number;
  pageSize: number;
}

/** GET list of marketing segments. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId"), {
      status: 400,
    });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Org not found"), {
      status: 404,
    });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 10));
  const search = (searchParams.get("search") ?? "").trim() || undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(apiError(API_ERROR_CODES.UNAUTHORIZED, "Unauthorized"), {
      status: 401,
    });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("marketing_segments")
    .select(SEGMENT_SELECT, { count: "exact" })
    .eq("tenant_id", orgId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    const term = `%${search}%`;
    query = query.ilike("name", term);
  }

  const { data: rows, error, count } = await query;

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), {
      status: 400,
    });
  }

  const items = (rows ?? []) as MarketingSegment[];
  const total = count ?? 0;
  return NextResponse.json(
    apiSuccess<GetMarketingSegmentsResult>({ items, total, page, pageSize }, total)
  );
}

export type UpsertMarketingSegmentBody = {
  id?: string;
  name: string;
  description?: string | null;
  /** Segment definition DSL, applied against leads/customers. */
  definition: Record<string, unknown>;
};

/** Create or update a marketing segment.
 *  POST without id -> create, with id -> update.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId"), {
      status: 400,
    });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Org not found"), {
      status: 404,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(apiError(API_ERROR_CODES.UNAUTHORIZED, "Unauthorized"), {
      status: 401,
    });
  }

  let body: UpsertMarketingSegmentBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), {
      status: 400,
    });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(
      apiError(API_ERROR_CODES.VALIDATION_ERROR, "Name is required"),
      { status: 400 }
    );
  }

  const definition =
    body.definition && typeof body.definition === "object" && !Array.isArray(body.definition)
      ? body.definition
      : {};

  const base: Record<string, unknown> = {
    tenant_id: orgId,
    name,
    description:
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null,
    definition,
  };

  const isUpdate = typeof body.id === "string" && body.id.trim().length > 0;

  if (isUpdate) {
    const { data: row, error } = await supabase
      .from("marketing_segments")
      .update(base)
      .eq("tenant_id", orgId)
      .eq("id", body.id)
      .select(SEGMENT_SELECT)
      .single();

    if (error) {
      return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), {
        status: 400,
      });
    }

    return NextResponse.json(apiSuccess(row as MarketingSegment));
  }

  const { data: row, error } = await supabase
    .from("marketing_segments")
    .insert(base)
    .select(SEGMENT_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), {
      status: 400,
    });
  }

  return NextResponse.json(apiSuccess(row as MarketingSegment), { status: 201 });
}

