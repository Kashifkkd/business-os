-- Organization (tenant) scoped settings: localization, formats, currency, etc.
-- organization_id = tenant id (one-to-one per organization).

CREATE TABLE IF NOT EXISTS public.organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  date_format TEXT NOT NULL DEFAULT 'MM/dd/yyyy',
  time_format TEXT NOT NULL DEFAULT '12h',
  currency TEXT NOT NULL DEFAULT 'USD',
  currency_symbol TEXT NOT NULL DEFAULT '$',
  number_format TEXT NOT NULL DEFAULT '1,234.56',
  language TEXT NOT NULL DEFAULT 'en',
  country TEXT NOT NULL DEFAULT 'US',
  locale TEXT NOT NULL DEFAULT 'en-US',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_settings_organization_id
  ON public.organization_settings(organization_id);

DROP TRIGGER IF EXISTS organization_settings_updated_at ON public.organization_settings;
CREATE TRIGGER organization_settings_updated_at
  BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- Only members of the organization can read/update its settings
CREATE POLICY "Users can view organization settings for own orgs"
  ON public.organization_settings FOR SELECT
  USING (organization_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY "Users can insert organization settings for own orgs"
  ON public.organization_settings FOR INSERT
  WITH CHECK (organization_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY "Users can update organization settings for own orgs"
  ON public.organization_settings FOR UPDATE
  USING (organization_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.organization_settings IS 'Per-organization locale, format, and display settings';
