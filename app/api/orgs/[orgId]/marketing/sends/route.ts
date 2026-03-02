import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import { getMarketingProvider } from "@/lib/marketing/providers";
import type { MarketingMessageSend } from "@/lib/supabase/types";

const SEND_SELECT =
  "id, tenant_id, campaign_id, journey_id, segment_id, template_id, channel, segment_definition_snapshot, status, send_at, sent_at, provider, provider_message_id, error_code, error_message, metadata, created_at, updated_at";

export type CreateSendBody = {
  campaign_id?: string | null;
  journey_id?: string | null;
  segment_id?: string | null;
  template_id?: string | null;
  channel: string;
  segment_definition_snapshot?: Record<string, unknown> | null;
  send_at?: string | null;
};

/** POST: create a marketing send (record only; actual dispatch can be async). */
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

  let body: CreateSendBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), {
      status: 400,
    });
  }

  const channel = typeof body.channel === "string" ? body.channel.trim() : "";
  if (!channel) {
    return NextResponse.json(
      apiError(API_ERROR_CODES.VALIDATION_ERROR, "Channel is required"),
      { status: 400 }
    );
  }

  const insert: Record<string, unknown> = {
    tenant_id: orgId,
    campaign_id: body.campaign_id?.trim() || null,
    journey_id: body.journey_id?.trim() || null,
    segment_id: body.segment_id?.trim() || null,
    template_id: body.template_id?.trim() || null,
    channel,
    segment_definition_snapshot:
      body.segment_definition_snapshot && typeof body.segment_definition_snapshot === "object"
        ? body.segment_definition_snapshot
        : null,
    status: body.send_at ? "scheduled" : "pending",
    send_at: body.send_at?.trim() || null,
    metadata: {},
  };

  const { data: row, error } = await supabase
    .from("marketing_message_sends")
    .insert(insert)
    .select(SEND_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), {
      status: 400,
    });
  }

  return NextResponse.json(apiSuccess(row as MarketingMessageSend), { status: 201 });
}

/** GET: list recent sends for the org (for analytics/tables). */
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(apiError(API_ERROR_CODES.UNAUTHORIZED, "Unauthorized"), {
      status: 401,
    });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  const channel = (searchParams.get("channel") ?? "").trim() || undefined;
  const campaign_id = (searchParams.get("campaign_id") ?? "").trim() || undefined;

  let query = supabase
    .from("marketing_message_sends")
    .select(SEND_SELECT)
    .eq("tenant_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (channel) query = query.eq("channel", channel);
  if (campaign_id) query = query.eq("campaign_id", campaign_id);

  const { data: rows, error } = await query;

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), {
      status: 400,
    });
  }

  return NextResponse.json(apiSuccess(rows as MarketingMessageSend[]));
}
