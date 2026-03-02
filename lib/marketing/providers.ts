export type MarketingChannel = "email" | "sms" | "whatsapp" | "social";

export interface SendMessageParams {
  tenantId: string;
  channel: MarketingChannel;
  to: string;
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface SendMessageResult {
  provider: string;
  providerMessageId: string | null;
}

export type MarketingEventType =
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "complained"
  | "unsubscribed"
  | "failed"
  | "replied";

export interface ProviderWebhookEvent {
  tenantExternalId?: string | null;
  channel: MarketingChannel;
  type: MarketingEventType;
  provider: string;
  providerMessageId: string | null;
  occurredAt: string;
  rawPayload: unknown;
}

export interface MarketingProvider {
  /** Provider identifier, e.g. "resend" or "twilio". */
  readonly name: string;

  /** Send a single message over the given channel. */
  sendMessage(params: SendMessageParams): Promise<SendMessageResult>;

  /** Parse an inbound webhook into a normalized event payload. */
  parseWebhookEvent(payload: unknown): Promise<ProviderWebhookEvent | null>;
}

/**
 * Default no-op provider used when no external provider is configured.
 * It pretends to send successfully but does not call any external API.
 */
export class NoopMarketingProvider implements MarketingProvider {
  readonly name = "noop";

  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    // In a future implementation, this could enqueue a job or log for local dev.
    return {
      provider: this.name,
      providerMessageId: null,
    };
  }

  async parseWebhookEvent(_payload: unknown): Promise<ProviderWebhookEvent | null> {
    // Noop provider does not emit webhooks.
    return null;
  }
}

/**
 * Factory to get the active marketing provider. For now we return a NOOP implementation.
 * Later this can be extended to look up tenant-specific integration settings.
 */
export function getMarketingProvider(_tenantId: string): MarketingProvider {
  return new NoopMarketingProvider();
}

