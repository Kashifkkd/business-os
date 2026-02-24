-- Store image URLs directly (e.g. from Firebase). Remove path-based avatar.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar_path;

-- Organization logo URL (set after upload to Firebase or other storage)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN public.tenants.logo_url IS 'URL of organization logo (e.g. from Firebase Storage).';
