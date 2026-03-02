import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";

export interface MarketingAnalyticsOverview {
  totalSends: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalUnsubscribed: number;
  byChannel: {
    channel: string;
    sends: number;
    delivered: number;
    opened: number;
    clicked: number;
  }[];
  byCampaign: {
    campaign_id: string | null;
    campaign_name: string | null;
    sends: number;
    opened: number;
    clicked: number;
  }[];
}

/** Basic marketing analytics overview for dashboard + campaigns. */
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
  const days = Math.max(1, Math.min(365, Number(searchParams.get("days")) || 30));
  const since = new Date();
  since.setDate(since.getDate() - days);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(apiError(API_ERROR_CODES.UNAUTHORIZED, "Unauthorized"), {
      status: 401,
    });
  }

  const sinceIso = since.toISOString();

  // Aggregate sends
  const { data: sendsRows, error: sendsError } = await supabase
    .from("marketing_message_sends")
    .select("id, channel, status, created_at, campaign_id")
    .eq("tenant_id", orgId)
    .gte("created_at", sinceIso);

  if (sendsError) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, sendsError.message), {
      status: 400,
    });
  }

  const sends = sendsRows ?? [];

  // Aggregate events
  const { data: eventsRows, error: eventsError } = await supabase
    .from("marketing_message_events")
    .select("id, message_send_id, campaign_id, channel, type, occurred_at")
    .eq("tenant_id", orgId)
    .gte("occurred_at", sinceIso);

  if (eventsError) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, eventsError.message), {
      status: 400,
    });
  }

  const events = eventsRows ?? [];

  const totalSends = sends.length;
  const byChannelMap = new Map<
    string,
    { channel: string; sends: number; delivered: number; opened: number; clicked: number }
  >();

  for (const send of sends as { channel: string }[]) {
    const key = send.channel ?? "unknown";
    if (!byChannelMap.has(key)) {
      byChannelMap.set(key, {
        channel: key,
        sends: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
      });
    }
    const agg = byChannelMap.get(key)!;
    agg.sends += 1;
  }

  let totalDelivered = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  let totalBounced = 0;
  let totalUnsubscribed = 0;

  const byCampaignMap = new Map<
    string,
    { campaign_id: string | null; campaign_name: string | null; sends: number; opened: number; clicked: number }
  >();

  const sendById = new Map<string, { campaign_id: string | null }>();
  for (const send of sends as { id: string; campaign_id: string | null }[]) {
    sendById.set(send.id, { campaign_id: send.campaign_id });
    const key = send.campaign_id ?? "unknown";
    if (!byCampaignMap.has(key)) {
      byCampaignMap.set(key, {
        campaign_id: send.campaign_id,
        campaign_name: null,
        sends: 0,
        opened: 0,
        clicked: 0,
      });
    }
    const agg = byCampaignMap.get(key)!;
    agg.sends += 1;
  }

  for (const event of events as {
    message_send_id: string | null;
    channel: string;
    type: string;
    campaign_id: string | null;
  }[]) {
    const type = event.type;
    if (type === "delivered") totalDelivered += 1;
    if (type === "opened") totalOpened += 1;
    if (type === "clicked") totalClicked += 1;
    if (type === "bounced" || type === "failed") totalBounced += 1;
    if (type === "unsubscribed" || type === "complained") totalUnsubscribed += 1;

    const channelKey = event.channel ?? "unknown";
    const byChannel = byChannelMap.get(channelKey);
    if (byChannel) {
      if (type === "delivered") byChannel.delivered += 1;
      if (type === "opened") byChannel.opened += 1;
      if (type === "clicked") byChannel.clicked += 1;
    }

    const campaignKey = event.campaign_id ?? sendById.get(event.message_send_id ?? "")?.campaign_id ?? "unknown";
    if (!byCampaignMap.has(campaignKey)) {
      byCampaignMap.set(campaignKey, {
        campaign_id: typeof campaignKey === "string" ? campaignKey : null,
        campaign_name: null,
        sends: 0,
        opened: 0,
        clicked: 0,
      });
    }
    const byCampaign = byCampaignMap.get(campaignKey)!;
    if (type === "opened") byCampaign.opened += 1;
    if (type === "clicked") byCampaign.clicked += 1;
  }

  // Optionally hydrate campaign names for top campaigns
  const topCampaignIds = Array.from(byCampaignMap.values())
    .map((c) => c.campaign_id)
    .filter((id): id is string => !!id);

  if (topCampaignIds.length > 0) {
    const { data: campaignRows } = await supabase
      .from("marketing_campaigns")
      .select("id, name")
      .in("id", topCampaignIds);

    const nameMap = new Map<string, string>();
    for (const row of campaignRows ?? []) {
      const r = row as { id: string; name: string };
      nameMap.set(r.id, r.name);
    }
    for (const agg of byCampaignMap.values()) {
      if (agg.campaign_id) {
        agg.campaign_name = nameMap.get(agg.campaign_id) ?? null;
      }
    }
  }

  const overview: MarketingAnalyticsOverview = {
    totalSends,
    totalDelivered,
    totalOpened,
    totalClicked,
    totalBounced,
    totalUnsubscribed,
    byChannel: Array.from(byChannelMap.values()),
    byCampaign: Array.from(byCampaignMap.values()),
  };

  return NextResponse.json(apiSuccess(overview));
}

