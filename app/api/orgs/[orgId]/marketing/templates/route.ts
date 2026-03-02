import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { MarketingTemplate } from "@/lib/supabase/types";

const TEMPLATE_SELECT =
  "id, tenant_id, name, description, channel, subject, body, variables, is_active, created_at, updated_at";

export interface GetMarketingTemplatesResult {
  items: MarketingTemplate[];
  total: number;
  page: number;
  pageSize: number;
}

/** GET list of marketing templates (optionally filtered by channel). */
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
  const channel = (searchParams.get("channel") ?? "").trim() || undefined;

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
    .from("marketing_templates")
    .select(TEMPLATE_SELECT, { count: "exact" })
    .eq("tenant_id", orgId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (channel) {
    query = query.eq("channel", channel);
  }
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

  const items = (rows ?? []) as MarketingTemplate[];
  const total = count ?? 0;
  return NextResponse.json(
    apiSuccess<GetMarketingTemplatesResult>({ items, total, page, pageSize }, total)
  );
}

export type UpsertMarketingTemplateBody = {
  id?: string;
  name: string;
  description?: string | null;
  channel: string;
  subject?: string | null;
  body: string;
  variables?: string[] | null;
  is_active?: boolean;
};

/** Create or update a marketing template. */
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

  let body: UpsertMarketingTemplateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), {
      status: 400,
    });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const channel = typeof body.channel === "string" ? body.channel.trim() : "";
  const content = typeof body.body === "string" ? body.body : "";

  if (!name) {
    return NextResponse.json(
      apiError(API_ERROR_CODES.VALIDATION_ERROR, "Name is required"),
      { status: 400 }
    );
  }
  if (!channel) {
    return NextResponse.json(
      apiError(API_ERROR_CODES.VALIDATION_ERROR, "Channel is required"),
      { status: 400 }
    );
  }
  if (!content.trim()) {
    return NextResponse.json(
      apiError(API_ERROR_CODES.VALIDATION_ERROR, "Body is required"),
      { status: 400 }
    );
  }

  const variables =
    Array.isArray(body.variables) && body.variables.length > 0
      ? body.variables.filter((v) => typeof v === "string")
      : [];

  const base: Record<string, unknown> = {
    tenant_id: orgId,
    name,
    description:
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null,
    channel,
    subject:
      typeof body.subject === "string" && body.subject.trim()
        ? body.subject.trim()
        : null,
    body: content,
    variables,
    is_active: body.is_active ?? true,
  };

  const isUpdate = typeof body.id === "string" && body.id.trim().length > 0;

  if (isUpdate) {
    const { data: row, error } = await supabase
      .from("marketing_templates")
      .update(base)
      .eq("tenant_id", orgId)
      .eq("id", body.id)
      .select(TEMPLATE_SELECT)
      .single();

    if (error) {
      return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), {
        status: 400,
      });
    }

    return NextResponse.json(apiSuccess(row as MarketingTemplate));
  }

  const { data: row, error } = await supabase
    .from("marketing_templates")
    .insert(base)
    .select(TEMPLATE_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), {
      status: 400,
    });
  }

  return NextResponse.json(apiSuccess(row as MarketingTemplate), { status: 201 });
}

