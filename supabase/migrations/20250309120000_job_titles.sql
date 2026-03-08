-- Job titles table: tenant-scoped list for lead metadata.job_title
CREATE TABLE public.job_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_job_titles_tenant_name ON public.job_titles(tenant_id, name);
CREATE INDEX idx_job_titles_tenant_id ON public.job_titles(tenant_id);

CREATE TRIGGER job_titles_updated_at
  BEFORE UPDATE ON public.job_titles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage job titles"
  ON public.job_titles FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));
