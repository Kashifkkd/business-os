-- Listings: add title, price, description, published_at for workflow and display
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

COMMENT ON COLUMN public.listings.title IS 'Listing title or headline';
COMMENT ON COLUMN public.listings.price IS 'Asking or list price';
COMMENT ON COLUMN public.listings.description IS 'Full listing description';
COMMENT ON COLUMN public.listings.published_at IS 'Set when status changes to published';
