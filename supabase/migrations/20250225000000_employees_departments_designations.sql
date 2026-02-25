-- Employees module: departments, designations, employees (cross-industry, tenant-scoped)
-- Hierarchy: tenant → departments → designations → employees (with optional reports_to)

-- Departments
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  parent_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_departments_tenant_id ON public.departments(tenant_id);
CREATE INDEX idx_departments_tenant_parent ON public.departments(tenant_id, parent_id);

CREATE TRIGGER departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage departments"
  ON public.departments FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.departments IS 'Departments per tenant (e.g. Sales, Kitchen, HR)';

-- Designations (job titles)
CREATE TABLE public.designations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  level INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_designations_tenant_name_department
  ON public.designations(tenant_id, name)
  WHERE department_id IS NULL;

CREATE UNIQUE INDEX idx_designations_tenant_department_name
  ON public.designations(tenant_id, department_id, name)
  WHERE department_id IS NOT NULL;

CREATE INDEX idx_designations_tenant_id ON public.designations(tenant_id);
CREATE INDEX idx_designations_department_id ON public.designations(department_id);

CREATE TRIGGER designations_updated_at
  BEFORE UPDATE ON public.designations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage designations"
  ON public.designations FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.designations IS 'Job titles per tenant; optional department scope';

-- Employees
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  designation_id UUID NOT NULL REFERENCES public.designations(id) ON DELETE RESTRICT,
  reports_to_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  employee_number TEXT,
  join_date DATE,
  leave_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_employees_tenant_id ON public.employees(tenant_id);
CREATE INDEX idx_employees_tenant_department ON public.employees(tenant_id, department_id);
CREATE INDEX idx_employees_tenant_active ON public.employees(tenant_id, is_active);
CREATE INDEX idx_employees_reports_to ON public.employees(reports_to_id);
CREATE UNIQUE INDEX idx_employees_tenant_employee_number
  ON public.employees(tenant_id, employee_number)
  WHERE employee_number IS NOT NULL AND employee_number != '';

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage employees"
  ON public.employees FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.employees IS 'Employee records: department, designation, optional profile and reports_to';
