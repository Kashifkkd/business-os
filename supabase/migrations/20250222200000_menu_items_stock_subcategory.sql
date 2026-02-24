-- Menu items: stock, sub-category, minimum order (for cafe add-item form)
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER,
  ADD COLUMN IF NOT EXISTS minimum_stock INTEGER,
  ADD COLUMN IF NOT EXISTS sub_category TEXT,
  ADD COLUMN IF NOT EXISTS minimum_order INTEGER DEFAULT 1;

COMMENT ON COLUMN public.menu_items.stock_quantity IS 'Current stock (optional inventory)';
COMMENT ON COLUMN public.menu_items.minimum_stock IS 'Alert when stock falls below this';
COMMENT ON COLUMN public.menu_items.sub_category IS 'e.g. Latte, Cappuccino under Coffee';
COMMENT ON COLUMN public.menu_items.minimum_order IS 'Minimum quantity per order (default 1)';
