-- UUID7 for tenant id (time-ordered). Generated in DB; not passed from client.
CREATE OR REPLACE FUNCTION public.uuid_generate_v7()
RETURNS UUID AS $$
  SELECT (FORMAT(
    '%s-%s-%s-%s-%s',
    lpad(to_hex(trunc(EXTRACT(EPOCH FROM statement_timestamp()) * 1000)::bigint >> 16), 8, '0'),
    lpad(to_hex(trunc(EXTRACT(EPOCH FROM statement_timestamp()) * 1000)::bigint & 65535), 4, '0'),
    lpad(to_hex((trunc(random() * 2^12) + 28672)::bigint), 4, '0'),
    lpad(to_hex((trunc(random() * 2^14) + 32768)::bigint), 4, '0'),
    lpad(to_hex(trunc(random() * 2^48)::bigint), 12, '0')
  ))::uuid;
$$ LANGUAGE SQL;

-- Industry enum for tenant type (extensible) – create only if not present
DO $$ BEGIN
  CREATE TYPE public.industry_type AS ENUM ('cafe', 'real_estate');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tenants: id is UUID7, generated in DB. Used in URL (e.g. /:id/home).
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  name TEXT NOT NULL,
  industry industry_type NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles: extends auth.users (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant membership: which users belong to which tenants
DO $$ BEGIN
  CREATE TYPE public.tenant_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role tenant_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_tenants_industry ON public.tenants(industry);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id ON public.tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id ON public.tenant_members(user_id);

-- Updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tenants_updated_at ON public.tenants;
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Create profile on signup (trigger on auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create tenant and add current user as owner. id is UUID7 generated in DB.
CREATE OR REPLACE FUNCTION public.create_tenant(
  p_industry industry_type,
  p_name TEXT
)
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  INSERT INTO public.tenants (name, industry)
  VALUES (p_name, p_industry)
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.tenant_members (tenant_id, user_id, role)
  VALUES (v_tenant_id, auth.uid(), 'owner');

  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_tenant(industry_type, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tenant(industry_type, TEXT) TO service_role;

COMMENT ON TABLE public.tenants IS 'Multi-tenant organizations (cafe, real_estate, etc.)';
COMMENT ON TABLE public.profiles IS 'User profiles synced from auth.users';
COMMENT ON TABLE public.tenant_members IS 'Membership of users in tenants with role';
