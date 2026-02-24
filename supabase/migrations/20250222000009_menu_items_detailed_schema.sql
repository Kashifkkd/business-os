-- Menu items: detailed industry schema, price as numeric, soft delete
-- Add new columns first
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dietary_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS unit TEXT;

-- Migrate price_cents to price, then drop price_cents
UPDATE public.menu_items SET price = price_cents / 100.0 WHERE price IS NULL;
ALTER TABLE public.menu_items ALTER COLUMN price SET NOT NULL;
ALTER TABLE public.menu_items DROP COLUMN IF EXISTS price_cents;

-- Index for listing non-deleted items by tenant (and category/sort)
CREATE INDEX IF NOT EXISTS idx_menu_items_tenant_deleted
  ON public.menu_items(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_menu_items_tenant_category_sort
  ON public.menu_items(tenant_id, category, sort_order, name) WHERE deleted_at IS NULL;

-- Comment for documentation
COMMENT ON COLUMN public.menu_items.price IS 'Selling price in currency (e.g. 9.99)';
COMMENT ON COLUMN public.menu_items.deleted_at IS 'Set for soft delete; exclude from normal listings';
COMMENT ON COLUMN public.menu_items.dietary_tags IS 'e.g. vegetarian, vegan, gluten-free';
COMMENT ON COLUMN public.menu_items.allergens IS 'e.g. nuts, dairy, shellfish';
COMMENT ON COLUMN public.menu_items.unit IS 'e.g. each, 100g, slice';
