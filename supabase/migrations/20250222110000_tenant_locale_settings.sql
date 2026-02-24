-- Move organization_settings into tenants (organization detail in one place).
-- Add locale/format columns to tenants, migrate data, drop organization_settings.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS date_format TEXT NOT NULL DEFAULT 'MM/dd/yyyy',
  ADD COLUMN IF NOT EXISTS time_format TEXT NOT NULL DEFAULT '12h',
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS currency_symbol TEXT NOT NULL DEFAULT '$',
  ADD COLUMN IF NOT EXISTS number_format TEXT NOT NULL DEFAULT '1,234.56',
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en-US';

-- Migrate existing organization_settings into tenants
UPDATE public.tenants t
SET
  timezone = COALESCE(s.timezone, 'UTC'),
  date_format = COALESCE(s.date_format, 'MM/dd/yyyy'),
  time_format = COALESCE(s.time_format, '12h'),
  currency = COALESCE(s.currency, 'USD'),
  currency_symbol = COALESCE(s.currency_symbol, '$'),
  number_format = COALESCE(s.number_format, '1,234.56'),
  language = COALESCE(s.language, 'en'),
  country = COALESCE(s.country, 'US'),
  locale = COALESCE(s.locale, 'en-US')
FROM public.organization_settings s
WHERE s.organization_id = t.id;

-- Drop the separate settings table
DROP TABLE IF EXISTS public.organization_settings;

COMMENT ON COLUMN public.tenants.timezone IS 'IANA timezone for the organization';
COMMENT ON COLUMN public.tenants.date_format IS 'Date format token (e.g. MM/dd/yyyy, MMM d yyyy)';
COMMENT ON COLUMN public.tenants.locale IS 'Default locale (e.g. en-US) for formatting';
