-- Property images: array of image URLs (e.g. from Supabase Storage).
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
COMMENT ON COLUMN public.properties.images IS 'Array of image URLs; first is typically the primary/cover.';
