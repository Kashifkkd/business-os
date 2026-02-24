-- Enable RLS on all tenant-scoped tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- Helper: current user's IDs of tenants they are a member of
CREATE OR REPLACE FUNCTION public.user_tenant_ids()
RETURNS SETOF UUID AS $$
  SELECT tenant_id FROM public.tenant_members WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Tenants: users can only see tenants they belong to
CREATE POLICY "Users can view own tenants"
  ON public.tenants FOR SELECT
  USING (id IN (SELECT public.user_tenant_ids()));

CREATE POLICY "Users can insert tenant and become owner"
  ON public.tenants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own tenants"
  ON public.tenants FOR UPDATE
  USING (id IN (SELECT public.user_tenant_ids()));

-- Profiles: users can read own profile; can read profiles of members in same tenant
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can view profiles in same tenant"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT tm.user_id FROM public.tenant_members tm
      WHERE tm.tenant_id IN (SELECT public.user_tenant_ids())
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Tenant members: users can see members of their tenants
CREATE POLICY "Users can view members of own tenants"
  ON public.tenant_members FOR SELECT
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Only existing owner/admin can add new members (see create_tenant for first member)
CREATE POLICY "Members can add tenant members"
  ON public.tenant_members FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT public.user_tenant_ids())
    AND EXISTS (
      SELECT 1 FROM public.tenant_members m
      WHERE m.tenant_id = tenant_members.tenant_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can manage members"
  ON public.tenant_members FOR UPDATE
  USING (
    tenant_id IN (SELECT public.user_tenant_ids())
    AND (
      EXISTS (
        SELECT 1 FROM public.tenant_members m
        WHERE m.tenant_id = tenant_members.tenant_id
          AND m.user_id = auth.uid()
          AND m.role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "Owners and admins can delete members"
  ON public.tenant_members FOR DELETE
  USING (
    tenant_id IN (SELECT public.user_tenant_ids())
    AND (
      EXISTS (
        SELECT 1 FROM public.tenant_members m
        WHERE m.tenant_id = tenant_members.tenant_id
          AND m.user_id = auth.uid()
          AND m.role IN ('owner', 'admin')
      )
    )
  );
