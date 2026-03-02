-- Link cafe menu_items to inventory_items for stock management.

-- 1) Add optional inventory_item_id FK on menu_items.
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.menu_items.inventory_item_id IS 'Optional link to inventory_items for centralized stock management';

-- NOTE: Data backfill/migration from existing stock_quantity/minimum_stock into
-- inventory_items and inventory_stock_levels can be implemented in a follow-up
-- migration or via a one-off script once tenants are ready to adopt the
-- dedicated inventory module. For now we only add the structural link.

