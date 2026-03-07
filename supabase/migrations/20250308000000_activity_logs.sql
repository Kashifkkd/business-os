-- Activity / audit logs: CRUD and user operations per tenant (industry-standard audit trail)
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_tenant_created_at ON public.activity_logs(tenant_id, created_at DESC);
CREATE INDEX idx_activity_logs_tenant_entity ON public.activity_logs(tenant_id, entity_type, entity_id);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can read activity logs"
  ON public.activity_logs FOR SELECT
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Inserts/updates only from backend (service role or authenticated app logic); no direct user INSERT policy
-- so that only API routes using createActivityLog can write. Use a permissive policy that allows
-- any tenant member to insert (the app will pass the correct tenant_id and user_id).
CREATE POLICY "Tenant members can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));
