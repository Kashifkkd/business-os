import type { SupabaseClient } from "@supabase/supabase-js";
import type { JournalEntry } from "@/lib/supabase/types";

export type LedgerLineInput = {
  account_id: string;
  contact_id?: string | null;
  debit: number;
  credit: number;
  currency?: string;
  fx_rate?: number;
  line_memo?: string | null;
  dimension_tags?: Record<string, unknown>;
};

export type TenantAccountDefaults = {
  ar_account_id: string;
  revenue_account_id: string;
  tax_payable_account_id?: string;
  ap_account_id: string;
  expense_account_id: string;
  cash_account_id: string;
  expense_liability_account_id?: string;
  inventory_account_id?: string;
  cogs_account_id?: string;
};

function round4(n: number): number {
  return Math.round(n * 1e4) / 1e4;
}

export async function assertPeriodNotClosed(
  supabase: SupabaseClient,
  tenantId: string,
  entryDate: string
): Promise<void> {
  const { data } = await supabase
    .from("closed_periods")
    .select("id")
    .eq("tenant_id", tenantId)
    .gte("period_end_date", entryDate)
    .limit(1);
  if (data?.length) {
    throw new Error("Cannot post: this period is closed.");
  }
}

export async function getNextJournalEntryNumber(
  supabase: SupabaseClient,
  tenantId: string
): Promise<string> {
  const { data: rows, error } = await supabase
    .from("journal_entries")
    .select("entry_number")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  const prefix = "JE-";
  let maxNum = 0;
  for (const r of rows ?? []) {
    const num = parseInt(String(r.entry_number).replace(prefix, ""), 10);
    if (!Number.isNaN(num) && num > maxNum) maxNum = num;
  }
  return `${prefix}${String(maxNum + 1).padStart(5, "0")}`;
}

function validateLines(tenantId: string, lines: LedgerLineInput[]): void {
  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of lines) {
    if (line.debit < 0 || line.credit < 0)
      throw new Error("Debit and credit must be non-negative");
    if (line.debit > 0 && line.credit > 0)
      throw new Error("A line cannot have both debit and credit");
    totalDebit += line.debit;
    totalCredit += line.credit;
  }
  totalDebit = round4(totalDebit);
  totalCredit = round4(totalCredit);
  if (Math.abs(totalDebit - totalCredit) > 1e-6) {
    throw new Error(`Debits (${totalDebit}) must equal credits (${totalCredit})`);
  }
}

export type CreateJournalEntryParams = {
  entry_date: string;
  memo?: string | null;
  source_type?: string | null;
  source_id?: string | null;
  lines: LedgerLineInput[];
};

export async function createJournalEntry(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string | null,
  params: CreateJournalEntryParams
): Promise<JournalEntry> {
  const { entry_date, memo, source_type, source_id, lines } = params;
  if (!lines.length) throw new Error("At least one journal line is required");
  validateLines(tenantId, lines);

  await assertPeriodNotClosed(supabase, tenantId, entry_date);

  const entryNumber = await getNextJournalEntryNumber(supabase, tenantId);

  const { data: entry, error: entryError } = await supabase
    .from("journal_entries")
    .insert({
      tenant_id: tenantId,
      entry_number: entryNumber,
      entry_date: entry_date,
      source_type: source_type ?? null,
      source_id: source_id ?? null,
      memo: memo ?? null,
      status: "draft",
      created_by: userId,
    })
    .select()
    .single();

  if (entryError || !entry) throw new Error(entryError?.message ?? "Failed to create journal entry");

  const currency = lines[0]?.currency ?? "USD";
  const fxRate = lines[0]?.fx_rate ?? 1;

  const lineRows = lines.map((l) => ({
    tenant_id: tenantId,
    journal_entry_id: entry.id,
    account_id: l.account_id,
    contact_id: l.contact_id ?? null,
    debit: round4(l.debit),
    credit: round4(l.credit),
    currency: l.currency ?? currency,
    fx_rate: l.fx_rate ?? fxRate,
    line_memo: l.line_memo ?? null,
    dimension_tags: l.dimension_tags ?? {},
  }));

  const { error: linesError } = await supabase.from("journal_lines").insert(lineRows);
  if (linesError) {
    await supabase.from("journal_entries").delete().eq("id", entry.id);
    throw new Error(linesError.message);
  }

  const { data: updated, error: updateError } = await supabase
    .from("journal_entries")
    .update({ status: "posted" })
    .eq("id", entry.id)
    .select()
    .single();

  if (updateError || !updated) throw new Error(updateError?.message ?? "Failed to post journal entry");
  return updated as JournalEntry;
}

export async function getExistingJournalEntryForSource(
  supabase: SupabaseClient,
  tenantId: string,
  sourceType: string,
  sourceId: string
): Promise<JournalEntry | null> {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .eq("status", "posted")
    .maybeSingle();
  if (error || !data) return null;
  return data as JournalEntry;
}

export async function postInvoice(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string | null,
  invoiceId: string,
  defaults: TenantAccountDefaults
): Promise<JournalEntry> {
  const existing = await getExistingJournalEntryForSource(
    supabase,
    tenantId,
    "invoice",
    invoiceId
  );
  if (existing) throw new Error("Invoice already posted to ledger");

  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", invoiceId)
    .single();
  if (invErr || !inv) throw new Error("Invoice not found");
  if (inv.status === "void") throw new Error("Cannot post voided invoice");

  const { data: invLines } = await supabase
    .from("invoice_lines")
    .select("*")
    .eq("invoice_id", invoiceId)
    .eq("tenant_id", tenantId);

  const subtotal = Number(inv.subtotal) ?? 0;
  const taxTotal = Number(inv.tax_total) ?? 0;
  const total = Number(inv.total) ?? 0;
  const currency = inv.currency ?? "USD";

  const lines: LedgerLineInput[] = [];
  lines.push({
    account_id: defaults.ar_account_id,
    contact_id: inv.customer_id,
    debit: total,
    credit: 0,
    currency,
    line_memo: `Invoice ${inv.invoice_number}`,
  });
  if (subtotal > 0) {
    lines.push({
      account_id: defaults.revenue_account_id,
      debit: 0,
      credit: subtotal,
      currency,
      line_memo: "Revenue",
    });
  }
  if (taxTotal > 0 && defaults.tax_payable_account_id) {
    lines.push({
      account_id: defaults.tax_payable_account_id,
      debit: 0,
      credit: taxTotal,
      currency,
      line_memo: "Tax",
    });
  }

  const entry = await createJournalEntry(supabase, tenantId, userId, {
    entry_date: inv.invoice_date,
    memo: `Invoice ${inv.invoice_number}`,
    source_type: "invoice",
    source_id: invoiceId,
    lines,
  });

  await supabase
    .from("invoices")
    .update({ status: "sent", balance: total })
    .eq("id", invoiceId)
    .eq("tenant_id", tenantId);

  return entry;
}

export async function postCustomerPayment(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string | null,
  paymentId: string,
  defaults: Pick<TenantAccountDefaults, "cash_account_id" | "ar_account_id">
): Promise<JournalEntry> {
  const existing = await getExistingJournalEntryForSource(
    supabase,
    tenantId,
    "customer_payment",
    paymentId
  );
  if (existing) throw new Error("Payment already posted to ledger");

  const { data: payment, error: payErr } = await supabase
    .from("customer_payments")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", paymentId)
    .single();
  if (payErr || !payment) throw new Error("Payment not found");

  const amount = Number(payment.amount) ?? 0;
  if (amount <= 0) throw new Error("Payment amount must be positive");

  const lines: LedgerLineInput[] = [
    {
      account_id: defaults.cash_account_id,
      contact_id: payment.customer_id,
      debit: amount,
      credit: 0,
      currency: payment.currency ?? "USD",
      line_memo: "Customer payment",
    },
    {
      account_id: defaults.ar_account_id,
      contact_id: payment.customer_id,
      debit: 0,
      credit: amount,
      currency: payment.currency ?? "USD",
      line_memo: "Payment applied to AR",
    },
  ];

  return createJournalEntry(supabase, tenantId, userId, {
    entry_date: payment.payment_date,
    memo: `Customer payment`,
    source_type: "customer_payment",
    source_id: paymentId,
    lines,
  });
}

export async function postVendorBill(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string | null,
  billId: string,
  defaults: Pick<TenantAccountDefaults, "ap_account_id" | "expense_account_id" | "inventory_account_id">
): Promise<JournalEntry> {
  const existing = await getExistingJournalEntryForSource(
    supabase,
    tenantId,
    "vendor_bill",
    billId
  );
  if (existing) throw new Error("Bill already posted to ledger");

  const { data: bill, error: billErr } = await supabase
    .from("vendor_bills")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", billId)
    .single();
  if (billErr || !bill) throw new Error("Bill not found");

  const amount = Number(bill.amount) ?? 0;
  const currency = bill.currency ?? "USD";

  const { data: billLines } = await supabase
    .from("vendor_bill_lines")
    .select("*")
    .eq("vendor_bill_id", billId)
    .eq("tenant_id", tenantId);

  const lines: LedgerLineInput[] = [];
  if (billLines?.length) {
    for (const bl of billLines) {
      const acctId = bl.account_id ?? defaults.expense_account_id;
      lines.push({
        account_id: acctId,
        debit: Number(bl.line_total) ?? 0,
        credit: 0,
        currency,
        line_memo: bl.description,
      });
    }
    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    lines.push({
      account_id: defaults.ap_account_id,
      contact_id: null,
      debit: 0,
      credit: totalDebit,
      currency,
      line_memo: `Bill ${bill.bill_number ?? billId}`,
    });
  } else {
    lines.push(
      {
        account_id: defaults.expense_account_id,
        debit: amount,
        credit: 0,
        currency,
        line_memo: `Bill ${bill.bill_number ?? billId}`,
      },
      {
        account_id: defaults.ap_account_id,
        debit: 0,
        credit: amount,
        currency,
        line_memo: `Bill ${bill.bill_number ?? billId}`,
      }
    );
  }

  return createJournalEntry(supabase, tenantId, userId, {
    entry_date: bill.bill_date,
    memo: `Vendor bill ${bill.bill_number ?? billId}`,
    source_type: "vendor_bill",
    source_id: billId,
    lines,
  });
}

export async function postVendorPayment(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string | null,
  paymentId: string,
  defaults: Pick<TenantAccountDefaults, "cash_account_id" | "ap_account_id">
): Promise<JournalEntry> {
  const existing = await getExistingJournalEntryForSource(
    supabase,
    tenantId,
    "vendor_payment",
    paymentId
  );
  if (existing) throw new Error("Payment already posted to ledger");

  const { data: payment, error: payErr } = await supabase
    .from("vendor_payments")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", paymentId)
    .single();
  if (payErr || !payment) throw new Error("Payment not found");

  const amount = Number(payment.amount) ?? 0;
  if (amount <= 0) throw new Error("Payment amount must be positive");

  const lines: LedgerLineInput[] = [
    {
      account_id: defaults.ap_account_id,
      debit: amount,
      credit: 0,
      currency: payment.currency ?? "USD",
      line_memo: "Vendor payment",
    },
    {
      account_id: defaults.cash_account_id,
      debit: 0,
      credit: amount,
      currency: payment.currency ?? "USD",
      line_memo: "Payment to vendor",
    },
  ];

  return createJournalEntry(supabase, tenantId, userId, {
    entry_date: payment.payment_date,
    memo: "Vendor payment",
    source_type: "vendor_payment",
    source_id: paymentId,
    lines,
  });
}

export async function postExpenseReport(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string | null,
  reportId: string,
  defaults: Pick<TenantAccountDefaults, "expense_account_id" | "expense_liability_account_id" | "cash_account_id">
): Promise<JournalEntry> {
  const existing = await getExistingJournalEntryForSource(
    supabase,
    tenantId,
    "expense_report",
    reportId
  );
  if (existing) throw new Error("Expense report already posted to ledger");

  const { data: report, error: reportErr } = await supabase
    .from("expense_reports")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", reportId)
    .single();
  if (reportErr || !report) throw new Error("Expense report not found");
  if (report.status !== "approved" && report.status !== "paid")
    throw new Error("Expense report must be approved before posting");

  const { data: reportLines } = await supabase
    .from("expense_lines")
    .select("*")
    .eq("expense_report_id", reportId)
    .eq("tenant_id", tenantId);

  const currency = report.currency ?? "USD";
  const lines: LedgerLineInput[] = [];
  let totalExpense = 0;
  for (const el of reportLines ?? []) {
    const amt = Number(el.amount) ?? 0;
    totalExpense += amt;
    lines.push({
      account_id: el.category_account_id,
      debit: amt,
      credit: 0,
      currency,
      line_memo: el.description,
    });
  }
  const creditAccount = defaults.expense_liability_account_id ?? defaults.cash_account_id;
  lines.push({
    account_id: creditAccount,
    debit: 0,
    credit: totalExpense,
    currency,
    line_memo: `Expense report ${report.report_number}`,
  });

  const entry = await createJournalEntry(supabase, tenantId, userId, {
    entry_date: report.paid_at ? report.paid_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
    memo: `Expense report ${report.report_number}`,
    source_type: "expense_report",
    source_id: reportId,
    lines,
  });

  await supabase
    .from("expense_reports")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", reportId)
    .eq("tenant_id", tenantId);

  return entry;
}

export async function postInventoryMovement(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string | null,
  movementId: string,
  defaults: Pick<TenantAccountDefaults, "inventory_account_id" | "cogs_account_id" | "expense_account_id">
): Promise<JournalEntry | null> {
  const existing = await getExistingJournalEntryForSource(
    supabase,
    tenantId,
    "inventory_movement",
    movementId
  );
  if (existing) return null;

  const { data: mov, error: movErr } = await supabase
    .from("inventory_stock_movements")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", movementId)
    .single();
  if (movErr || !mov) return null;

  const qty = Number(mov.quantity) ?? 0;
  if (qty === 0) return null;

  const { data: item } = await supabase
    .from("inventory_items")
    .select("id, cost")
    .eq("id", mov.item_id)
    .single();
  const unitCost = item?.cost != null ? Number(item.cost) : 0;
  const amount = Math.abs(qty) * unitCost;
  if (amount <= 0 || !defaults.inventory_account_id) return null;

  const invAccount = defaults.inventory_account_id;
  const offsetAccount = qty > 0 ? (defaults.expense_account_id ?? defaults.cogs_account_id) : (defaults.cogs_account_id ?? defaults.expense_account_id);

  const lines: LedgerLineInput[] =
    qty > 0
      ? [
          { account_id: invAccount, debit: amount, credit: 0, line_memo: mov.reason ?? "Stock in" },
          { account_id: offsetAccount!, debit: 0, credit: amount, line_memo: mov.reason ?? "Stock in" },
        ]
      : [
          { account_id: offsetAccount!, debit: amount, credit: 0, line_memo: mov.reason ?? "Stock out" },
          { account_id: invAccount, debit: 0, credit: amount, line_memo: mov.reason ?? "Stock out" },
        ];

  return createJournalEntry(supabase, tenantId, userId, {
    entry_date: mov.created_at.slice(0, 10),
    memo: `Inventory movement ${mov.movement_type}`,
    source_type: "inventory_movement",
    source_id: movementId,
    lines,
  });
}
