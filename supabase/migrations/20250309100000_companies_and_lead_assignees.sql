-- Companies table: tenant-scoped, referenced by leads
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_companies_tenant_name ON public.companies(tenant_id, name);
CREATE INDEX idx_companies_tenant_id ON public.companies(tenant_id);

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage companies"
  ON public.companies FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Lead assignees: many-to-many (lead -> users/members)
CREATE TABLE public.lead_assignees (
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (lead_id, user_id)
);

CREATE INDEX idx_lead_assignees_lead_id ON public.lead_assignees(lead_id);
CREATE INDEX idx_lead_assignees_user_id ON public.lead_assignees(user_id);
CREATE INDEX idx_lead_assignees_tenant_id ON public.lead_assignees(tenant_id);

ALTER TABLE public.lead_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage lead assignees"
  ON public.lead_assignees FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Add company_id to leads; keep company (text) for backfill then drop
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Backfill: create companies from distinct lead.company, then set lead.company_id
INSERT INTO public.companies (tenant_id, name)
SELECT DISTINCT tenant_id, trim(company)
FROM public.leads
WHERE trim(company) <> '' AND company IS NOT NULL
ON CONFLICT (tenant_id, name) DO NOTHING;

UPDATE public.leads l
SET company_id = c.id
FROM public.companies c
WHERE c.tenant_id = l.tenant_id AND c.name = trim(l.company)
AND l.company IS NOT NULL AND trim(l.company) <> '';

ALTER TABLE public.leads DROP COLUMN IF EXISTS company;

CREATE INDEX IF NOT EXISTS idx_leads_company_id ON public.leads(company_id);
