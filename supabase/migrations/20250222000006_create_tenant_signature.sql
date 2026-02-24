-- create_tenant: UUID7 generated in DB. Signature (p_industry, p_name).
DROP FUNCTION IF EXISTS public.create_tenant(TEXT, TEXT, industry_type);
DROP FUNCTION IF EXISTS public.create_tenant(industry_type, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_tenant(UUID, industry_type, TEXT);

CREATE FUNCTION public.create_tenant(
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

NOTIFY pgrst, 'reload schema';
