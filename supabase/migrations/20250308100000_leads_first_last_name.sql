-- Switch leads from single name to first_name + last_name (industry standard)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Backfill: split existing name on first space (first word = first_name, rest = last_name)
UPDATE public.leads
SET
  first_name = CASE
    WHEN position(' ' IN trim(name)) > 0 THEN split_part(trim(name), ' ', 1)
    ELSE trim(name)
  END,
  last_name = CASE
    WHEN position(' ' IN trim(name)) > 0 THEN nullif(trim(substring(trim(name) from position(' ' IN trim(name)) + 1)), '')
    ELSE null
  END
WHERE first_name IS NULL AND name IS NOT NULL;

-- Set NOT NULL and default for any remaining nulls
UPDATE public.leads SET first_name = '' WHERE first_name IS NULL;
UPDATE public.leads SET last_name = '' WHERE last_name IS NULL;
ALTER TABLE public.leads ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE public.leads ALTER COLUMN first_name SET DEFAULT '';
ALTER TABLE public.leads ALTER COLUMN last_name SET NOT NULL;
ALTER TABLE public.leads ALTER COLUMN last_name SET DEFAULT '';

-- Drop name column
ALTER TABLE public.leads DROP COLUMN IF EXISTS name;

-- Index for search/sort by last name
CREATE INDEX IF NOT EXISTS idx_leads_last_name ON public.leads(tenant_id, last_name);
CREATE INDEX IF NOT EXISTS idx_leads_first_name ON public.leads(tenant_id, first_name);
