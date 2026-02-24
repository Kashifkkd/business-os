-- Menu items: add discounted_price (nullable, for sale/discount display)
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS discounted_price NUMERIC(10, 2);

COMMENT ON COLUMN public.menu_items.discounted_price IS 'Optional sale/discounted price (e.g. when on offer)';
