-- Add created_by to lead_stages (user who created the stage).
ALTER TABLE public.lead_stages
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.lead_stages.created_by IS 'User who created this stage (null for seeded/default stages).';
