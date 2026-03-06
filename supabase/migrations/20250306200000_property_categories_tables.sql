-- Property categories and subcategories (tenant-scoped).
-- properties.category_id / properties.subcategory_id reference these tables.

CREATE TABLE public.property_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_property_categories_tenant ON public.property_categories(tenant_id);

ALTER TABLE public.property_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage property_categories"
  ON public.property_categories FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE TRIGGER property_categories_updated_at
  BEFORE UPDATE ON public.property_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.property_categories IS 'Property categories per tenant (e.g. Residential, Commercial)';

-- Sub-categories (parent = category)
CREATE TABLE public.property_sub_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.property_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category_id, name)
);

CREATE INDEX idx_property_sub_categories_tenant ON public.property_sub_categories(tenant_id);
CREATE INDEX idx_property_sub_categories_category ON public.property_sub_categories(category_id);

ALTER TABLE public.property_sub_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage property_sub_categories"
  ON public.property_sub_categories FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE TRIGGER property_sub_categories_updated_at
  BEFORE UPDATE ON public.property_sub_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.property_sub_categories IS 'Property sub-categories under a category (e.g. Single Family under Residential)';

-- Link properties to categories (columns already exist from 20250226100001).
-- If you have existing category_id/subcategory_id values, set them to NULL first or this may fail.
ALTER TABLE public.properties
  ADD CONSTRAINT properties_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES public.property_categories(id) ON DELETE SET NULL;

ALTER TABLE public.properties
  ADD CONSTRAINT properties_subcategory_id_fkey
  FOREIGN KEY (subcategory_id) REFERENCES public.property_sub_categories(id) ON DELETE SET NULL;
