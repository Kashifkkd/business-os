-- Add created_by to lead_sources (user who added the source).
ALTER TABLE public.lead_sources
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.lead_sources.created_by IS 'User who added this source (null for seeded/default sources).';
