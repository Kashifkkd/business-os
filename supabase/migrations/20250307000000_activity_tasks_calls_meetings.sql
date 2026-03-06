-- Activities module: CRM-style tasks, calls, meetings (Zoho-style)
-- Supports optional lead_id and deal_id for linking to leads/deals.

-- Activity tasks -----------------------------------------------------------
CREATE TABLE public.activity_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started', 'deferred', 'in_progress', 'completed', 'waiting_on_someone'
  )),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN (
    'highest', 'high', 'normal', 'low', 'lowest'
  )),
  due_date DATE,
  owner_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_tasks_tenant_id ON public.activity_tasks(tenant_id);
CREATE INDEX idx_activity_tasks_lead_id ON public.activity_tasks(lead_id);
CREATE INDEX idx_activity_tasks_deal_id ON public.activity_tasks(deal_id);
CREATE INDEX idx_activity_tasks_due_date ON public.activity_tasks(tenant_id, due_date);
CREATE INDEX idx_activity_tasks_owner ON public.activity_tasks(tenant_id, owner_id);

CREATE TRIGGER activity_tasks_updated_at
  BEFORE UPDATE ON public.activity_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.activity_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage activity tasks"
  ON public.activity_tasks FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.activity_tasks IS 'CRM-style tasks linked to leads/deals.';

-- Activity calls -----------------------------------------------------------
CREATE TABLE public.activity_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  subject TEXT,
  description TEXT,
  call_type TEXT NOT NULL DEFAULT 'outbound' CHECK (call_type IN ('inbound', 'outbound')),
  call_status TEXT NOT NULL DEFAULT 'attended' CHECK (call_status IN (
    'attended', 'missed', 'busy', 'no_answer', 'other'
  )),
  call_start_time TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER,
  call_result TEXT,
  call_agenda TEXT,
  call_purpose TEXT,
  owner_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_calls_tenant_id ON public.activity_calls(tenant_id);
CREATE INDEX idx_activity_calls_lead_id ON public.activity_calls(lead_id);
CREATE INDEX idx_activity_calls_deal_id ON public.activity_calls(deal_id);
CREATE INDEX idx_activity_calls_start_time ON public.activity_calls(tenant_id, call_start_time DESC);
CREATE INDEX idx_activity_calls_owner ON public.activity_calls(tenant_id, owner_id);

CREATE TRIGGER activity_calls_updated_at
  BEFORE UPDATE ON public.activity_calls
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.activity_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage activity calls"
  ON public.activity_calls FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.activity_calls IS 'Call logs linked to leads/deals.';

-- Activity meetings -------------------------------------------------------
CREATE TABLE public.activity_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  venue TEXT,
  all_day BOOLEAN NOT NULL DEFAULT FALSE,
  participant_ids JSONB NOT NULL DEFAULT '[]'::JSONB,
  owner_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_meetings_tenant_id ON public.activity_meetings(tenant_id);
CREATE INDEX idx_activity_meetings_lead_id ON public.activity_meetings(lead_id);
CREATE INDEX idx_activity_meetings_deal_id ON public.activity_meetings(deal_id);
CREATE INDEX idx_activity_meetings_start_time ON public.activity_meetings(tenant_id, start_time DESC);
CREATE INDEX idx_activity_meetings_owner ON public.activity_meetings(tenant_id, owner_id);

CREATE TRIGGER activity_meetings_updated_at
  BEFORE UPDATE ON public.activity_meetings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.activity_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage activity meetings"
  ON public.activity_meetings FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.activity_meetings IS 'Meetings linked to leads/deals.';
