import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { MarketingJourney } from "@/lib/supabase/types";

const JOURNEY_SELECT =
  "id, tenant_id, name, description, status, trigger_type, trigger_config, steps, created_at, updated_at";

export interface GetMarketingJourneysResult {
  items: MarketingJourney[];
  total: number;
  page: number;
  pageSize: number;
}

/** GET list of marketing journeys. */
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
    .from("marketing_journeys")
    .select(JOURNEY_SELECT, { count: "exact" })
    .eq("tenant_id", orgId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    const term = `%${search}%`;
    query = query.ilike("name", term);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data: rows, error, count } = await query;

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), {
      status: 400,
    });
  }

  const items = (rows ?? []) as MarketingJourney[];
  const total = count ?? 0;
  return NextResponse.json(
    apiSuccess<GetMarketingJourneysResult>({ items, total, page, pageSize }, total)
  );
}

export type UpsertMarketingJourneyBody = {
  id?: string;
  name: string;
  description?: string | null;
  status?: string | null;
  trigger_type: string;
  trigger_config?: Record<string, unknown>;
  steps: unknown[];
};

/** Create or update a marketing journey. */
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

  let body: UpsertMarketingJourneyBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), {
      status: 400,
    });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const triggerType = typeof body.trigger_type === "string" ? body.trigger_type.trim() : "";
  if (!name) {
    return NextResponse.json(
      apiError(API_ERROR_CODES.VALIDATION_ERROR, "Name is required"),
      { status: 400 }
    );
  }
  if (!triggerType) {
    return NextResponse.json(
      apiError(API_ERROR_CODES.VALIDATION_ERROR, "Trigger type is required"),
      { status: 400 }
    );
  }

  const triggerConfig =
    body.trigger_config &&
    typeof body.trigger_config === "object" &&
    !Array.isArray(body.trigger_config)
      ? body.trigger_config
      : {};

  const stepsArray = Array.isArray(body.steps) ? body.steps : [];

  const base: Record<string, unknown> = {
    tenant_id: orgId,
    name,
    description:
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null,
    status:
      typeof body.status === "string" && body.status.trim()
        ? body.status.trim()
        : "draft",
    trigger_type: triggerType,
    trigger_config: triggerConfig,
    steps: stepsArray,
  };

  const isUpdate = typeof body.id === "string" && body.id.trim().length > 0;

  if (isUpdate) {
    const { data: row, error } = await supabase
      .from("marketing_journeys")
      .update(base)
      .eq("tenant_id", orgId)
      .eq("id", body.id)
      .select(JOURNEY_SELECT)
      .single();

    if (error) {
      return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), {
        status: 400,
      });
    }

    return NextResponse.json(apiSuccess(row as MarketingJourney));
  }

  const { data: row, error } = await supabase
    .from("marketing_journeys")
    .insert(base)
    .select(JOURNEY_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), {
      status: 400,
    });
  }

  return NextResponse.json(apiSuccess(row as MarketingJourney), { status: 201 });
}

