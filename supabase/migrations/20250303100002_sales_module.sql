-- Sales module: pipeline stages, deals, deal activities, products (phase 2), deal products (phase 2)

-- Pipeline stages -----------------------------------------------------------
CREATE TABLE public.sales_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_won BOOLEAN NOT NULL DEFAULT FALSE,
  is_lost BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_sales_pipeline_stages_tenant_id
  ON public.sales_pipeline_stages(tenant_id);

CREATE INDEX idx_sales_pipeline_stages_tenant_sort
  ON public.sales_pipeline_stages(tenant_id, sort_order, name);

CREATE TRIGGER sales_pipeline_stages_updated_at
  BEFORE UPDATE ON public.sales_pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.sales_pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage sales pipeline stages"
  ON public.sales_pipeline_stages FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.sales_pipeline_stages IS 'Sales pipeline stages per tenant (e.g. Qualification, Proposal, Negotiation, Won, Lost).';

-- Deals ---------------------------------------------------------------------
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  stage_id UUID NOT NULL REFERENCES public.sales_pipeline_stages(id) ON DELETE RESTRICT,
  owner_id UUID,
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_value NUMERIC(12,2),
  probability INTEGER CHECK (probability BETWEEN 0 AND 100),
  expected_close_date DATE,
  close_date DATE,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deals_tenant_id
  ON public.deals(tenant_id);

CREATE INDEX idx_deals_tenant_stage
  ON public.deals(tenant_id, stage_id);

CREATE INDEX idx_deals_tenant_expected_close
  ON public.deals(tenant_id, expected_close_date DESC);

CREATE INDEX idx_deals_tenant_lead
  ON public.deals(tenant_id, lead_id);

CREATE INDEX idx_deals_tenant_owner
  ON public.deals(tenant_id, owner_id);

CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage deals"
  ON public.deals FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.deals IS 'Sales deals/opportunities per tenant.';

-- Deal activities -----------------------------------------------------------
CREATE TABLE public.deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note', 'email', 'call', 'status_change')),
  content TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL
);

CREATE INDEX idx_deal_activities_deal_id
  ON public.deal_activities(deal_id);

CREATE INDEX idx_deal_activities_tenant_deal_created
  ON public.deal_activities(tenant_id, deal_id, created_at DESC);

ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage deal activities"
  ON public.deal_activities FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.deal_activities IS 'Activity timeline entries for deals (notes, calls, emails, status changes).';

-- Products (Phase 2) --------------------------------------------------------
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_tenant_id
  ON public.products(tenant_id);

CREATE INDEX idx_products_tenant_active
  ON public.products(tenant_id, is_active, name);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage products"
  ON public.products FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.products IS 'Product catalog per tenant for use in sales deals (line items).';

-- Deal products (Phase 2) ---------------------------------------------------
CREATE TABLE public.deal_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_products_tenant_id
  ON public.deal_products(tenant_id);

CREATE INDEX idx_deal_products_deal_id
  ON public.deal_products(deal_id);

ALTER TABLE public.deal_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage deal products"
  ON public.deal_products FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.deal_products IS 'Line items linking deals to products.';

-- Seed default pipeline stages for existing tenants
INSERT INTO public.sales_pipeline_stages (tenant_id, name, sort_order, is_won, is_lost)
SELECT t.id, s.name, s.ord, s.is_won, s.is_lost
FROM public.tenants t
CROSS JOIN (VALUES
  ('Qualification', 0, FALSE, FALSE),
  ('Proposal', 1, FALSE, FALSE),
  ('Negotiation', 2, FALSE, FALSE),
  ('Closed Won', 3, TRUE, FALSE),
  ('Closed Lost', 4, FALSE, TRUE)
) AS s(name, ord, is_won, is_lost)
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_pipeline_stages sp WHERE sp.tenant_id = t.id
);
