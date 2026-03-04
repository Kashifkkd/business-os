-- Add created_by to departments and designations (user who created the record).

ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.departments.created_by IS 'User who created this department (auth.users.id).';

ALTER TABLE public.designations
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.designations.created_by IS 'User who created this designation (auth.users.id).';
