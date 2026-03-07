-- Add created_by to leads (user who created the lead).
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.leads.created_by IS 'User who created this lead (null for legacy rows).';
