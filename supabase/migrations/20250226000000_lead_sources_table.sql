-- Lead sources: per-tenant lookup table (name + color). Seeded when org is created.
CREATE TABLE public.lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#64748b',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_lead_sources_tenant_id ON public.lead_sources(tenant_id);
CREATE INDEX idx_lead_sources_tenant_sort ON public.lead_sources(tenant_id, sort_order, name);

CREATE TRIGGER lead_sources_updated_at
  BEFORE UPDATE ON public.lead_sources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage lead sources"
  ON public.lead_sources FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.lead_sources IS 'Lead source options per tenant (e.g. Website, Referral); created when org is created.';

-- Seed default lead sources for new tenants inside create_tenant
DROP FUNCTION IF EXISTS public.create_tenant(industry_type, TEXT);

CREATE FUNCTION public.create_tenant(
  p_industry industry_type,
  p_name TEXT
)
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  INSERT INTO public.tenants (name, industry)
  VALUES (p_name, p_industry)
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.tenant_members (tenant_id, user_id, role)
  VALUES (v_tenant_id, auth.uid(), 'owner');

  INSERT INTO public.lead_sources (tenant_id, name, color, sort_order)
  VALUES
    (v_tenant_id, 'website', '#64748b', 1),
    (v_tenant_id, 'referral', '#64748b', 2),
    (v_tenant_id, 'manual', '#64748b', 3),
    (v_tenant_id, 'cold_outbound', '#64748b', 4);

  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_tenant(industry_type, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tenant(industry_type, TEXT) TO service_role;

-- Backfill existing tenants: add default lead sources for any tenant that has none
INSERT INTO public.lead_sources (tenant_id, name, color, sort_order)
SELECT t.id, s.name, s.color, s.ord
FROM public.tenants t
CROSS JOIN (VALUES
  ('website', '#64748b', 1),
  ('referral', '#64748b', 2),
  ('manual', '#64748b', 3),
  ('cold_outbound', '#64748b', 4)
) AS s(name, color, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM public.lead_sources ls WHERE ls.tenant_id = t.id
);
