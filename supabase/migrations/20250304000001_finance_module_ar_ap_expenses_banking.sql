-- Finance module: tax rates, AR (invoices, customer payments), AP (vendor payments, bill lines),
-- expense reports, bank accounts and transactions.
-- References: tenants, accounts, journal_entries (GL), vendors, sales_orders.

-- ============================
-- Tax rates
-- ============================

CREATE TABLE public.tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate NUMERIC(8, 4) NOT NULL CHECK (rate >= 0),
  type TEXT NOT NULL CHECK (type IN ('sales_tax', 'vat', 'gst', 'withholding')),
  is_compound BOOLEAN NOT NULL DEFAULT FALSE,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tax_rates_tenant_id ON public.tax_rates(tenant_id);

CREATE TRIGGER tax_rates_updated_at
  BEFORE UPDATE ON public.tax_rates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage tax_rates"
  ON public.tax_rates FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.tax_rates IS 'Tax rates per tenant for invoices, bills, expenses';

ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS tax_rate_id UUID REFERENCES public.tax_rates(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_accounts_tax_rate_id ON public.accounts(tax_rate_id);

-- ============================
-- AR: Invoices
-- ============================

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id UUID,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'void')),
  invoice_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  due_date DATE,
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  source_sales_order_id UUID REFERENCES public.sales_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, invoice_number)
);

CREATE INDEX idx_invoices_tenant_id ON public.invoices(tenant_id);
CREATE INDEX idx_invoices_tenant_status ON public.invoices(tenant_id, status);
CREATE INDEX idx_invoices_customer ON public.invoices(tenant_id, customer_id);
CREATE INDEX idx_invoices_source_so ON public.invoices(source_sales_order_id);

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage invoices"
  ON public.invoices FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.invoices IS 'Sales invoices (AR) per tenant';

CREATE TABLE public.invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(14, 3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(14, 2) NOT NULL,
  discount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  tax_rate_id UUID REFERENCES public.tax_rates(id) ON DELETE SET NULL,
  line_total NUMERIC(14, 2) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_lines_tenant_invoice ON public.invoice_lines(tenant_id, invoice_id);

CREATE TRIGGER invoice_lines_updated_at
  BEFORE UPDATE ON public.invoice_lines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage invoice_lines"
  ON public.invoice_lines FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.invoice_lines IS 'Line items for invoices';

-- ============================
-- AR: Customer payments
-- ============================

CREATE TABLE public.customer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id UUID,
  payment_date DATE NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  method TEXT,
  reference TEXT,
  applied_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_payments_tenant_id ON public.customer_payments(tenant_id);
CREATE INDEX idx_customer_payments_customer ON public.customer_payments(tenant_id, customer_id);

CREATE TRIGGER customer_payments_updated_at
  BEFORE UPDATE ON public.customer_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage customer_payments"
  ON public.customer_payments FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.customer_payments IS 'Customer payments (AR)';

CREATE TABLE public.customer_payment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.customer_payments(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  applied_amount NUMERIC(14, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (payment_id, invoice_id)
);

CREATE INDEX idx_customer_payment_apps_tenant ON public.customer_payment_applications(tenant_id);
CREATE INDEX idx_customer_payment_apps_payment ON public.customer_payment_applications(payment_id);

ALTER TABLE public.customer_payment_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage customer_payment_applications"
  ON public.customer_payment_applications FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.customer_payment_applications IS 'Application of customer payments to invoices';

-- ============================
-- AP: Vendor bill lines (itemized)
-- ============================

CREATE TABLE public.vendor_bill_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vendor_bill_id UUID NOT NULL REFERENCES public.vendor_bills(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(14, 3) NOT NULL DEFAULT 1,
  unit_cost NUMERIC(14, 2) NOT NULL,
  tax_rate_id UUID REFERENCES public.tax_rates(id) ON DELETE SET NULL,
  line_total NUMERIC(14, 2) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_bill_lines_tenant_bill ON public.vendor_bill_lines(tenant_id, vendor_bill_id);

CREATE TRIGGER vendor_bill_lines_updated_at
  BEFORE UPDATE ON public.vendor_bill_lines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.vendor_bill_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage vendor_bill_lines"
  ON public.vendor_bill_lines FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.vendor_bill_lines IS 'Itemized lines for vendor bills (inventory or expense account)';

-- ============================
-- AP: Vendor payments
-- ============================

CREATE TABLE public.vendor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  payment_date DATE NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  method TEXT,
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_payments_tenant_id ON public.vendor_payments(tenant_id);
CREATE INDEX idx_vendor_payments_vendor ON public.vendor_payments(tenant_id, vendor_id);

CREATE TRIGGER vendor_payments_updated_at
  BEFORE UPDATE ON public.vendor_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.vendor_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage vendor_payments"
  ON public.vendor_payments FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.vendor_payments IS 'Vendor payments (AP)';

CREATE TABLE public.vendor_payment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.vendor_payments(id) ON DELETE CASCADE,
  bill_id UUID NOT NULL REFERENCES public.vendor_bills(id) ON DELETE CASCADE,
  applied_amount NUMERIC(14, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (payment_id, bill_id)
);

CREATE INDEX idx_vendor_payment_apps_tenant ON public.vendor_payment_applications(tenant_id);
CREATE INDEX idx_vendor_payment_apps_payment ON public.vendor_payment_applications(payment_id);

ALTER TABLE public.vendor_payment_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage vendor_payment_applications"
  ON public.vendor_payment_applications FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.vendor_payment_applications IS 'Application of vendor payments to bills';

-- ============================
-- Employee expense reports
-- ============================

CREATE TABLE public.expense_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  report_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'paid')),
  currency TEXT NOT NULL DEFAULT 'USD',
  total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, report_number)
);

CREATE INDEX idx_expense_reports_tenant_id ON public.expense_reports(tenant_id);
CREATE INDEX idx_expense_reports_tenant_status ON public.expense_reports(tenant_id, status);
CREATE INDEX idx_expense_reports_employee ON public.expense_reports(tenant_id, employee_id);

CREATE TRIGGER expense_reports_updated_at
  BEFORE UPDATE ON public.expense_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.expense_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage expense_reports"
  ON public.expense_reports FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.expense_reports IS 'Employee expense reports (employee_id references user/profile)';

CREATE TABLE public.expense_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  expense_report_id UUID NOT NULL REFERENCES public.expense_reports(id) ON DELETE CASCADE,
  category_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  expense_date DATE NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  tax_rate_id UUID REFERENCES public.tax_rates(id) ON DELETE SET NULL,
  receipt_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expense_lines_tenant_report ON public.expense_lines(tenant_id, expense_report_id);

CREATE TRIGGER expense_lines_updated_at
  BEFORE UPDATE ON public.expense_lines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.expense_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage expense_lines"
  ON public.expense_lines FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.expense_lines IS 'Line items for expense reports';

-- ============================
-- Banking
-- ============================

CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  institution TEXT,
  account_number_masked TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  linked_gl_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  import_source TEXT,
  import_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bank_accounts_tenant_id ON public.bank_accounts(tenant_id);

CREATE TRIGGER bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage bank_accounts"
  ON public.bank_accounts FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.bank_accounts IS 'Bank accounts linked to GL for reconciliation';

CREATE TABLE public.bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  reference TEXT,
  status TEXT NOT NULL DEFAULT 'unreconciled' CHECK (status IN ('unreconciled', 'reconciled')),
  matched_journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  import_source TEXT,
  import_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bank_transactions_tenant_id ON public.bank_transactions(tenant_id);
CREATE INDEX idx_bank_transactions_bank_account ON public.bank_transactions(bank_account_id);
CREATE INDEX idx_bank_transactions_status ON public.bank_transactions(tenant_id, status);

CREATE TRIGGER bank_transactions_updated_at
  BEFORE UPDATE ON public.bank_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage bank_transactions"
  ON public.bank_transactions FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.bank_transactions IS 'Bank transactions for reconciliation';
