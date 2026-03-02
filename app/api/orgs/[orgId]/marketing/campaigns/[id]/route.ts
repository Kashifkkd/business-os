import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { MarketingCampaign } from "@/lib/supabase/types";

const CAMPAIGN_SELECT =
  "id, tenant_id, name, description, objective, status, primary_channel, budget_amount, budget_currency, starts_at, ends_at, primary_segment_id, owner_id, tags, metadata, created_at, updated_at";

type RouteParams = { orgId: string; id: string };

/** Get a single marketing campaign. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<RouteParams> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing params"), {
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

  const { data: row, error } = await supabase
    .from("marketing_campaigns")
    .select(CAMPAIGN_SELECT)
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Campaign not found"), {
      status: 404,
    });
  }

  return NextResponse.json(apiSuccess(row as MarketingCampaign));
}

export type UpdateMarketingCampaignBody = Partial<{
  name: string;
  description: string | null;
  objective: string | null;
  status: string;
  primary_channel: string | null;
  budget_amount: number | null;
  budget_currency: string | null;
  starts_at: string | null;
  ends_at: string | null;
  primary_segment_id: string | null;
  owner_id: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown>;
}>;

/** Update a marketing campaign. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<RouteParams> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing params"), {
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

  let body: UpdateMarketingCampaignBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), {
      status: 400,
    });
  }

  const update: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json(
        apiError(API_ERROR_CODES.VALIDATION_ERROR, "Name cannot be empty"),
        { status: 400 }
      );
    }
    update.name = name;
  }

  if ("description" in body) {
    update.description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;
  }

  if ("objective" in body) {
    update.objective =
      typeof body.objective === "string" && body.objective.trim()
        ? body.objective.trim()
        : null;
  }

  if (typeof body.status === "string" && body.status.trim()) {
    update.status = body.status.trim();
  }

  if ("primary_channel" in body) {
    update.primary_channel =
      typeof body.primary_channel === "string" && body.primary_channel.trim()
        ? body.primary_channel.trim()
        : null;
  }

  if ("budget_amount" in body) {
    update.budget_amount =
      typeof body.budget_amount === "number" && !Number.isNaN(body.budget_amount)
        ? body.budget_amount
        : null;
  }

  if ("budget_currency" in body) {
    update.budget_currency =
      typeof body.budget_currency === "string" && body.budget_currency.trim()
        ? body.budget_currency.trim()
        : null;
  }

  if ("starts_at" in body) {
    update.starts_at =
      typeof body.starts_at === "string" && body.starts_at.trim()
        ? body.starts_at
        : null;
  }

  if ("ends_at" in body) {
    update.ends_at =
      typeof body.ends_at === "string" && body.ends_at.trim() ? body.ends_at : null;
  }

  if ("primary_segment_id" in body) {
    update.primary_segment_id =
      typeof body.primary_segment_id === "string" && body.primary_segment_id.trim()
        ? body.primary_segment_id.trim()
        : null;
  }

  if ("owner_id" in body) {
    update.owner_id =
      typeof body.owner_id === "string" && body.owner_id.trim()
        ? body.owner_id.trim()
        : null;
  }

  if ("tags" in body) {
    update.tags = Array.isArray(body.tags)
      ? body.tags.filter((t) => typeof t === "string")
      : [];
  }

  if ("metadata" in body) {
    const metadata =
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? body.metadata
        : {};
    update.metadata = metadata;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Nothing to update"), {
      status: 400,
    });
  }

  const { data: row, error } = await supabase
    .from("marketing_campaigns")
    .update(update)
    .eq("tenant_id", orgId)
    .eq("id", id)
    .select(CAMPAIGN_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), {
      status: 400,
    });
  }

  return NextResponse.json(apiSuccess(row as MarketingCampaign));
}

/** Delete a marketing campaign. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<RouteParams> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing params"), {
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

  const { error } = await supabase
    .from("marketing_campaigns")
    .delete()
    .eq("tenant_id", orgId)
    .eq("id", id);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), {
      status: 400,
    });
  }

  return NextResponse.json(apiSuccess({ deleted: true as const }));
}

