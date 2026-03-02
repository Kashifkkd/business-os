import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMarketingProvider } from "@/lib/marketing/providers";

/**
 * Inbound webhook for marketing providers (e.g. Resend, Twilio).
 * POST body is provider-specific; we parse it and write to marketing_message_events.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerSlug } = await params;
  if (!providerSlug) {
    return NextResponse.json({ error: "Missing provider" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const provider = getMarketingProvider("");
  if (provider.name !== providerSlug) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const event = await provider.parseWebhookEvent(payload);
  if (!event || !event.tenantExternalId) {
    return NextResponse.json({ received: true });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("marketing_message_events").insert({
    tenant_id: event.tenantExternalId,
    message_send_id: null,
    campaign_id: null,
    journey_id: null,
    channel: event.channel,
    type: event.type,
    occurred_at: event.occurredAt,
    provider_payload: event.rawPayload as Record<string, unknown>,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
