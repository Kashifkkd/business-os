-- Marketing module: campaigns, segments, templates, journeys, sends, events

-- Campaigns ---------------------------------------------------------------
CREATE TABLE public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  objective TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  primary_channel TEXT,
  budget_amount BIGINT,
  budget_currency TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  primary_segment_id UUID,
  owner_id UUID,
  tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_campaigns_tenant_id
  ON public.marketing_campaigns(tenant_id);

CREATE INDEX idx_marketing_campaigns_tenant_status
  ON public.marketing_campaigns(tenant_id, status);

CREATE INDEX idx_marketing_campaigns_tenant_created_at
  ON public.marketing_campaigns(tenant_id, created_at DESC);

CREATE TRIGGER marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage marketing campaigns"
  ON public.marketing_campaigns FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Segments ---------------------------------------------------------------
CREATE TABLE public.marketing_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  definition JSONB NOT NULL,
  estimated_count BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_segments_tenant_id
  ON public.marketing_segments(tenant_id);

CREATE TRIGGER marketing_segments_updated_at
  BEFORE UPDATE ON public.marketing_segments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.marketing_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage marketing segments"
  ON public.marketing_segments FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Templates ---------------------------------------------------------------
CREATE TABLE public.marketing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  variables TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_templates_tenant_id
  ON public.marketing_templates(tenant_id);

CREATE INDEX idx_marketing_templates_tenant_channel
  ON public.marketing_templates(tenant_id, channel);

CREATE TRIGGER marketing_templates_updated_at
  BEFORE UPDATE ON public.marketing_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.marketing_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage marketing templates"
  ON public.marketing_templates FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Journeys ---------------------------------------------------------------
CREATE TABLE public.marketing_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}'::JSONB,
  steps JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_journeys_tenant_id
  ON public.marketing_journeys(tenant_id);

CREATE INDEX idx_marketing_journeys_tenant_status
  ON public.marketing_journeys(tenant_id, status);

CREATE TRIGGER marketing_journeys_updated_at
  BEFORE UPDATE ON public.marketing_journeys
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.marketing_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage marketing journeys"
  ON public.marketing_journeys FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Message sends ----------------------------------------------------------
CREATE TABLE public.marketing_message_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  journey_id UUID REFERENCES public.marketing_journeys(id) ON DELETE SET NULL,
  segment_id UUID REFERENCES public.marketing_segments(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.marketing_templates(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  segment_definition_snapshot JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  send_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  provider TEXT,
  provider_message_id TEXT,
  error_code TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_message_sends_tenant_id
  ON public.marketing_message_sends(tenant_id);

CREATE INDEX idx_marketing_message_sends_tenant_status
  ON public.marketing_message_sends(tenant_id, status);

CREATE INDEX idx_marketing_message_sends_tenant_channel
  ON public.marketing_message_sends(tenant_id, channel);

CREATE TRIGGER marketing_message_sends_updated_at
  BEFORE UPDATE ON public.marketing_message_sends
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.marketing_message_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage marketing message sends"
  ON public.marketing_message_sends FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Message events ---------------------------------------------------------
CREATE TABLE public.marketing_message_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  message_send_id UUID REFERENCES public.marketing_message_sends(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  journey_id UUID REFERENCES public.marketing_journeys(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_message_events_tenant_id
  ON public.marketing_message_events(tenant_id);

CREATE INDEX idx_marketing_message_events_message_send_id
  ON public.marketing_message_events(message_send_id);

ALTER TABLE public.marketing_message_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view marketing message events"
  ON public.marketing_message_events FOR SELECT
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

