-- Menu items: is_active (replaces is_available), images as array of URLs, long_description
ALTER TABLE public.menu_items
  RENAME COLUMN is_available TO is_active;

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS long_description TEXT;

-- Replace single image_url with images array
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'menu_items' AND column_name = 'image_url'
  ) THEN
    UPDATE public.menu_items
      SET images = CASE WHEN image_url IS NOT NULL AND image_url != '' THEN ARRAY[image_url] ELSE '{}' END
      WHERE image_url IS NOT NULL AND image_url != '';
    ALTER TABLE public.menu_items DROP COLUMN image_url;
  END IF;
END $$;

COMMENT ON COLUMN public.menu_items.is_active IS 'true = enabled, false = disabled (hidden from menu)';
COMMENT ON COLUMN public.menu_items.images IS 'Array of image URLs (e.g. from Supabase Storage)';
COMMENT ON COLUMN public.menu_items.long_description IS 'Extended description or rich content';
