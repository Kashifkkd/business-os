-- Add created_by to companies and job_titles (user who created the record).
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.job_titles
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.companies.created_by IS 'User who created this company.';
COMMENT ON COLUMN public.job_titles.created_by IS 'User who created this job title.';
