-- Menu items: food type (veg / non_veg), default veg
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS food_type TEXT NOT NULL DEFAULT 'veg'
  CHECK (food_type IN ('veg', 'non_veg'));

COMMENT ON COLUMN public.menu_items.food_type IS 'veg or non_veg, default veg';
