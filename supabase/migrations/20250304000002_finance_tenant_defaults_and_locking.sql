-- Tenant-level accounting defaults and period locking.
-- accounting profile (country, tax_model, etc.) can live in tenants.settings JSON;
-- default account IDs are stored here for consistent posting.

CREATE TABLE public.tenant_account_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  ar_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  revenue_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  tax_payable_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  ap_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  expense_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  cash_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  expense_liability_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  inventory_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  cogs_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  fx_gains_losses_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id)
);

CREATE INDEX idx_tenant_account_defaults_tenant_id
  ON public.tenant_account_defaults(tenant_id);

CREATE TRIGGER tenant_account_defaults_updated_at
  BEFORE UPDATE ON public.tenant_account_defaults
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.tenant_account_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage tenant_account_defaults"
  ON public.tenant_account_defaults FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.tenant_account_defaults IS 'Default GL account IDs per tenant for posting (AR, AP, revenue, etc.)';

-- Closed periods: no journal entries may be posted on or before period_end_date.
CREATE TABLE public.closed_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  period_end_date DATE NOT NULL,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, period_end_date)
);

CREATE INDEX idx_closed_periods_tenant_id
  ON public.closed_periods(tenant_id);

CREATE INDEX idx_closed_periods_tenant_date
  ON public.closed_periods(tenant_id, period_end_date DESC);

ALTER TABLE public.closed_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage closed_periods"
  ON public.closed_periods FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.closed_periods IS 'Accounting periods that are closed; posting is blocked on or before period_end_date';
