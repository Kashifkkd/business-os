-- Finance module (core GL): chart of accounts, journal entries, journal lines.
-- Double-entry: sum(debit) = sum(credit) per journal entry enforced in application layer.

-- ============================
-- Chart of accounts
-- ============================

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  subtype TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  parent_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE INDEX idx_accounts_tenant_id ON public.accounts(tenant_id);
CREATE INDEX idx_accounts_tenant_type ON public.accounts(tenant_id, type);
CREATE INDEX idx_accounts_parent ON public.accounts(parent_account_id);

CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage accounts"
  ON public.accounts FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.accounts IS 'Chart of accounts per tenant (GL)';

-- ============================
-- Journal entries (header)
-- ============================

CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entry_number TEXT NOT NULL,
  entry_date DATE NOT NULL,
  source_type TEXT,
  source_id UUID,
  memo TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, entry_number)
);

CREATE INDEX idx_journal_entries_tenant_id ON public.journal_entries(tenant_id);
CREATE INDEX idx_journal_entries_tenant_date ON public.journal_entries(tenant_id, entry_date);
CREATE INDEX idx_journal_entries_tenant_status ON public.journal_entries(tenant_id, status);
CREATE INDEX idx_journal_entries_source ON public.journal_entries(tenant_id, source_type, source_id);

CREATE TRIGGER journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage journal_entries"
  ON public.journal_entries FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.journal_entries IS 'Journal entry headers (double-entry)';

-- ============================
-- Journal lines (debit/credit)
-- ============================

CREATE TABLE public.journal_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  contact_id UUID,
  debit NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  fx_rate NUMERIC(18, 8) NOT NULL DEFAULT 1,
  line_memo TEXT,
  dimension_tags JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (debit >= 0 AND credit >= 0 AND (debit = 0 OR credit = 0))
);

CREATE INDEX idx_journal_lines_tenant_id ON public.journal_lines(tenant_id);
CREATE INDEX idx_journal_lines_journal_entry_id ON public.journal_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account_id ON public.journal_lines(account_id);
CREATE INDEX idx_journal_lines_tenant_account ON public.journal_lines(tenant_id, account_id);

CREATE TRIGGER journal_lines_updated_at
  BEFORE UPDATE ON public.journal_lines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage journal_lines"
  ON public.journal_lines FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.journal_lines IS 'Journal line items (debit/credit per account)';
