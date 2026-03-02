import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { MarketingCampaign } from "@/lib/supabase/types";

const CAMPAIGN_SELECT =
  "id, tenant_id, name, description, objective, status, primary_channel, budget_amount, budget_currency, starts_at, ends_at, primary_segment_id, owner_id, tags, metadata, created_at, updated_at";

export interface GetMarketingCampaignsResult {
  items: MarketingCampaign[];
  total: number;
  page: number;
  pageSize: number;
}

const SORT_COLUMNS = ["created_at", "name", "status", "starts_at"] as const;
type SortColumn = (typeof SORT_COLUMNS)[number];

/** GET list of marketing campaigns. */
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
  const status = (searchParams.get("status") ?? "").trim() || undefined;
  const channel = (searchParams.get("channel") ?? "").trim() || undefined;
  const sortByRaw = (searchParams.get("sortBy") ?? "created_at").trim();
  const sortBy: SortColumn = SORT_COLUMNS.includes(sortByRaw as SortColumn)
    ? (sortByRaw as SortColumn)
    : "created_at";
  const order = (searchParams.get("order") ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";

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
    .from("marketing_campaigns")
    .select(CAMPAIGN_SELECT, { count: "exact" })
    .eq("tenant_id", orgId)
    .order(sortBy, { ascending: order === "asc" })
    .range(from, to);

  if (search) {
    const term = `%${search}%`;
    query = query.or(`name.ilike.${term},description.ilike.${term},objective.ilike.${term}`);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (channel) {
    query = query.eq("primary_channel", channel);
  }

  const { data: rows, error, count } = await query;

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), {
      status: 400,
    });
  }

  const items = (rows ?? []) as MarketingCampaign[];
  const total = count ?? 0;
  return NextResponse.json(
    apiSuccess<GetMarketingCampaignsResult>({ items, total, page, pageSize }, total)
  );
}

export type CreateMarketingCampaignBody = {
  name: string;
  description?: string | null;
  objective?: string | null;
  status?: string | null;
  primary_channel?: string | null;
  budget_amount?: number | null;
  budget_currency?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  primary_segment_id?: string | null;
  owner_id?: string | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown>;
};

/** Create a marketing campaign. */
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

  let body: CreateMarketingCampaignBody;
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

  const metadata =
    body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? body.metadata
      : {};

  const insert: Record<string, unknown> = {
    tenant_id: orgId,
    name,
    description:
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null,
    objective:
      typeof body.objective === "string" && body.objective.trim()
        ? body.objective.trim()
        : null,
    status:
      typeof body.status === "string" && body.status.trim()
        ? body.status.trim()
        : "draft",
    primary_channel:
      typeof body.primary_channel === "string" && body.primary_channel.trim()
        ? body.primary_channel.trim()
        : null,
    budget_amount:
      typeof body.budget_amount === "number" && !Number.isNaN(body.budget_amount)
        ? body.budget_amount
        : null,
    budget_currency:
      typeof body.budget_currency === "string" && body.budget_currency.trim()
        ? body.budget_currency.trim()
        : null,
    starts_at:
      typeof body.starts_at === "string" && body.starts_at.trim()
        ? body.starts_at
        : null,
    ends_at:
      typeof body.ends_at === "string" && body.ends_at.trim()
        ? body.ends_at
        : null,
    primary_segment_id:
      typeof body.primary_segment_id === "string" && body.primary_segment_id.trim()
        ? body.primary_segment_id.trim()
        : null,
    owner_id:
      typeof body.owner_id === "string" && body.owner_id.trim()
        ? body.owner_id.trim()
        : null,
    tags: Array.isArray(body.tags) ? body.tags.filter((t) => typeof t === "string") : [],
    metadata: Object.keys(metadata).length > 0 ? metadata : {},
  };

  const { data: row, error } = await supabase
    .from("marketing_campaigns")
    .insert(insert)
    .select(CAMPAIGN_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), {
      status: 400,
    });
  }

  return NextResponse.json(apiSuccess(row as MarketingCampaign), { status: 201 });
}

