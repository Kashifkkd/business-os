-- Replace full_name with first_name and last_name (for DBs that ran initial_schema with full_name)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Backfill from full_name if column exists (one-time migration)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    UPDATE public.profiles
    SET
      first_name = COALESCE(nullif(trim(split_part(full_name, ' ', 1)), ''), full_name),
      last_name = CASE
        WHEN position(' ' in coalesce(full_name, '')) > 0
        THEN nullif(trim(substring(full_name from position(' ' in full_name) + 1)), '')
        ELSE NULL
      END
    WHERE full_name IS NOT NULL AND (first_name IS NULL AND last_name IS NULL);
    ALTER TABLE public.profiles DROP COLUMN full_name;
  END IF;
END $$;
