-- Menu discounts (tenant-scoped). Used for pricing calculation only; not stored on menu_items.
CREATE TABLE public.menu_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC NOT NULL CHECK (value >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_menu_discounts_tenant ON public.menu_discounts(tenant_id);

ALTER TABLE public.menu_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage menu_discounts"
  ON public.menu_discounts FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE TRIGGER menu_discounts_updated_at
  BEFORE UPDATE ON public.menu_discounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.menu_discounts IS 'Discount definitions for pricing calculation; not stored on menu items';
