-- Localization lives on the tenant (org) table; separate "Localization" settings tab is UI only.
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

COMMENT ON COLUMN public.tenants.timezone IS 'IANA timezone for the organization';
COMMENT ON COLUMN public.tenants.locale IS 'Default locale (e.g. en-US) for formatting';
