-- Categories and sub_categories (tenant-scoped); menu_items stores only sub_category_id

-- Categories table
CREATE TABLE public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_menu_categories_tenant ON public.menu_categories(tenant_id);

ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage menu_categories"
  ON public.menu_categories FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Sub-categories table (parent = category)
CREATE TABLE public.menu_sub_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category_id, name)
);

CREATE INDEX idx_menu_sub_categories_tenant ON public.menu_sub_categories(tenant_id);
CREATE INDEX idx_menu_sub_categories_category ON public.menu_sub_categories(category_id);

ALTER TABLE public.menu_sub_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage menu_sub_categories"
  ON public.menu_sub_categories FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Add sub_category_id to menu_items
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS sub_category_id UUID REFERENCES public.menu_sub_categories(id) ON DELETE SET NULL;

-- Backfill: for each distinct (tenant_id, category, sub_category) create category + sub_category and set sub_category_id
INSERT INTO public.menu_categories (tenant_id, name, sort_order)
SELECT DISTINCT tenant_id, NULLIF(TRIM(category), '') AS name, 0
FROM public.menu_items
WHERE category IS NOT NULL AND TRIM(category) != ''
ON CONFLICT (tenant_id, name) DO NOTHING;

INSERT INTO public.menu_sub_categories (tenant_id, category_id, name, sort_order)
SELECT DISTINCT mi.tenant_id, mc.id, NULLIF(TRIM(mi.sub_category), '') AS name, 0
FROM public.menu_items mi
JOIN public.menu_categories mc ON mc.tenant_id = mi.tenant_id AND mc.name = NULLIF(TRIM(mi.category), '')
WHERE mi.sub_category IS NOT NULL AND TRIM(mi.sub_category) != ''
ON CONFLICT (category_id, name) DO NOTHING;

UPDATE public.menu_items mi
SET sub_category_id = msc.id
FROM public.menu_sub_categories msc
JOIN public.menu_categories mc ON mc.id = msc.category_id
WHERE mi.tenant_id = msc.tenant_id
  AND TRIM(mi.category) = mc.name
  AND TRIM(mi.sub_category) = msc.name
  AND mi.sub_category_id IS NULL;

-- Drop old index that used category
DROP INDEX IF EXISTS public.idx_menu_items_tenant_category_sort;

-- New index for listing by sub_category
CREATE INDEX idx_menu_items_tenant_sub_category_sort
  ON public.menu_items(tenant_id, sub_category_id, sort_order, name) WHERE deleted_at IS NULL;

-- Drop category and sub_category columns
ALTER TABLE public.menu_items DROP COLUMN IF EXISTS category;
ALTER TABLE public.menu_items DROP COLUMN IF EXISTS sub_category;

-- Triggers for updated_at on new tables
CREATE TRIGGER menu_categories_updated_at
  BEFORE UPDATE ON public.menu_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER menu_sub_categories_updated_at
  BEFORE UPDATE ON public.menu_sub_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.menu_categories IS 'Menu categories (e.g. Coffee, Food) per tenant';
COMMENT ON TABLE public.menu_sub_categories IS 'Sub-categories under a category (e.g. Latte under Coffee)';
COMMENT ON COLUMN public.menu_items.sub_category_id IS 'FK to menu_sub_categories; category is derived via join';
