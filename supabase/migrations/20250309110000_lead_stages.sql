-- Lead stages: per-tenant pipeline stages (name, color, is_default). Replaces hardcoded lead.status.
CREATE TABLE public.lead_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#64748b',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_lead_stages_tenant_default ON public.lead_stages(tenant_id) WHERE is_default = true;
CREATE INDEX idx_lead_stages_tenant_id ON public.lead_stages(tenant_id);
CREATE INDEX idx_lead_stages_tenant_sort ON public.lead_stages(tenant_id, sort_order, name);

CREATE TRIGGER lead_stages_updated_at
  BEFORE UPDATE ON public.lead_stages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.lead_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage lead stages"
  ON public.lead_stages FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Seed default stages for all existing tenants (New = default, then Contacted, Qualified, Proposal, Won, Lost)
INSERT INTO public.lead_stages (tenant_id, name, color, sort_order, is_default)
SELECT t.id, s.name, s.color, s.ord, s.is_default
FROM public.tenants t
CROSS JOIN (VALUES
  ('New', '#0ea5e9', 1, true),
  ('Contacted', '#f59e0b', 2, false),
  ('Qualified', '#10b981', 3, false),
  ('Proposal', '#8b5cf6', 4, false),
  ('Won', '#22c55e', 5, false),
  ('Lost', '#94a3b8', 6, false)
) AS s(name, color, ord, is_default)
WHERE NOT EXISTS (SELECT 1 FROM public.lead_stages ls WHERE ls.tenant_id = t.id);

-- Add stage_id to leads; backfill from status (match stage name, case-insensitive where possible)
ALTER TABLE public.leads ADD COLUMN stage_id UUID REFERENCES public.lead_stages(id) ON DELETE SET NULL;

UPDATE public.leads l
SET stage_id = (
  SELECT ls.id FROM public.lead_stages ls
  WHERE ls.tenant_id = l.tenant_id
  AND lower(trim(ls.name)) = lower(trim(l.status))
  LIMIT 1
)
WHERE l.status IS NOT NULL AND trim(l.status) <> '';

-- For any lead without a match, set to the default stage for that tenant
UPDATE public.leads l
SET stage_id = (SELECT id FROM public.lead_stages WHERE tenant_id = l.tenant_id AND is_default = true LIMIT 1)
WHERE l.stage_id IS NULL;

-- If any lead still has null (no default stage), set to first stage by sort_order
UPDATE public.leads l
SET stage_id = (SELECT id FROM public.lead_stages WHERE tenant_id = l.tenant_id ORDER BY sort_order ASC LIMIT 1)
WHERE l.stage_id IS NULL;

ALTER TABLE public.leads ALTER COLUMN stage_id SET NOT NULL;
CREATE INDEX idx_leads_stage_id ON public.leads(stage_id);
CREATE INDEX idx_leads_tenant_stage ON public.leads(tenant_id, stage_id);

ALTER TABLE public.leads DROP COLUMN IF EXISTS status;
