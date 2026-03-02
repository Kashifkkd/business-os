import type { SupabaseClient } from "@supabase/supabase-js";

export type TrialBalanceRow = {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  debit: number;
  credit: number;
  balance: number;
};

export async function getTrialBalance(
  supabase: SupabaseClient,
  tenantId: string,
  fromDate: string,
  toDate: string
): Promise<TrialBalanceRow[]> {
  const { data: entries, error: entriesErr } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("status", "posted")
    .gte("entry_date", fromDate)
    .lte("entry_date", toDate);

  if (entriesErr) throw new Error(entriesErr.message);
  const entryIds = (entries ?? []).map((e: { id: string }) => e.id);
  if (entryIds.length === 0) return [];

  const { data: lines, error: linesErr } = await supabase
    .from("journal_lines")
    .select("account_id, debit, credit")
    .eq("tenant_id", tenantId)
    .in("journal_entry_id", entryIds);

  if (linesErr) throw new Error(linesErr.message);

  const byAccount = new Map<
    string,
    { debit: number; credit: number; account_id: string }
  >();
  for (const line of lines ?? []) {
    const j = line as { account_id: string; debit: number; credit: number };
    const cur = byAccount.get(j.account_id) ?? {
      account_id: j.account_id,
      debit: 0,
      credit: 0,
    };
    cur.debit += Number(j.debit) ?? 0;
    cur.credit += Number(j.credit) ?? 0;
    byAccount.set(j.account_id, cur);
  }

  const accountIds = [...byAccount.keys()];
  if (accountIds.length === 0) return [];

  const { data: accounts, error: accErr } = await supabase
    .from("accounts")
    .select("id, code, name, type")
    .eq("tenant_id", tenantId)
    .in("id", accountIds);

  if (accErr) throw new Error(accErr.message);
  const accMap = new Map(
    (accounts ?? []).map((a: { id: string; code: string; name: string; type: string }) => [
      a.id,
      { code: a.code, name: a.name, type: a.type },
    ])
  );

  const rows: TrialBalanceRow[] = [];
  for (const [accountId, totals] of byAccount) {
    const acc = accMap.get(accountId);
    if (!acc) continue;
    const balance = totals.debit - totals.credit;
    if (balance === 0 && totals.debit === 0 && totals.credit === 0) continue;
    rows.push({
      account_id: accountId,
      account_code: acc.code,
      account_name: acc.name,
      account_type: acc.type,
      debit: Math.round(totals.debit * 100) / 100,
      credit: Math.round(totals.credit * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });
  }
  rows.sort((a, b) => a.account_code.localeCompare(b.account_code));
  return rows;
}

export type ProfitAndLossSection = {
  type: "income" | "expense";
  accounts: Array<{ code: string; name: string; balance: number }>;
  total: number;
};

export async function getProfitAndLoss(
  supabase: SupabaseClient,
  tenantId: string,
  fromDate: string,
  toDate: string
): Promise<{ income: ProfitAndLossSection; expense: ProfitAndLossSection; net: number }> {
  const trial = await getTrialBalance(supabase, tenantId, fromDate, toDate);
  const income = trial.filter((r) => r.account_type === "income");
  const expense = trial.filter((r) => r.account_type === "expense");
  const incomeTotal = income.reduce((s, r) => s + r.balance, 0);
  const expenseTotal = expense.reduce((s, r) => s + Math.abs(r.balance), 0);
  return {
    income: {
      type: "income",
      accounts: income.map((r) => ({ code: r.account_code, name: r.account_name, balance: r.balance })),
      total: incomeTotal,
    },
    expense: {
      type: "expense",
      accounts: expense.map((r) => ({ code: r.account_code, name: r.account_name, balance: Math.abs(r.balance) })),
      total: expenseTotal,
    },
    net: Math.round((incomeTotal - expenseTotal) * 100) / 100,
  };
}

export type BalanceSheetSection = {
  type: "asset" | "liability" | "equity";
  accounts: Array<{ code: string; name: string; balance: number }>;
  total: number;
};

export async function getBalanceSheet(
  supabase: SupabaseClient,
  tenantId: string,
  asOfDate: string
): Promise<{
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  total_assets: number;
  total_liabilities_equity: number;
}> {
  const trial = await getTrialBalance(supabase, tenantId, "1900-01-01", asOfDate);
  const assets = trial.filter((r) => r.account_type === "asset");
  const liabilities = trial.filter((r) => r.account_type === "liability");
  const equity = trial.filter((r) => r.account_type === "equity");
  const totalAssets = assets.reduce((s, r) => s + r.balance, 0);
  const totalLiab = liabilities.reduce((s, r) => s + Math.abs(r.balance), 0);
  const totalEquity = equity.reduce((s, r) => s + r.balance, 0);
  return {
    assets: {
      type: "asset",
      accounts: assets.map((r) => ({ code: r.account_code, name: r.account_name, balance: r.balance })),
      total: totalAssets,
    },
    liabilities: {
      type: "liability",
      accounts: liabilities.map((r) => ({ code: r.account_code, name: r.account_name, balance: Math.abs(r.balance) })),
      total: totalLiab,
    },
    equity: {
      type: "equity",
      accounts: equity.map((r) => ({ code: r.account_code, name: r.account_name, balance: r.balance })),
      total: totalEquity,
    },
    total_assets: Math.round(totalAssets * 100) / 100,
    total_liabilities_equity: Math.round((totalLiab + totalEquity) * 100) / 100,
  };
}

export async function getCashFlow(
  supabase: SupabaseClient,
  tenantId: string,
  fromDate: string,
  toDate: string
): Promise<{
  operating: number;
  investing: number;
  financing: number;
  net_change: number;
}> {
  const trial = await getTrialBalance(supabase, tenantId, fromDate, toDate);
  const cashAccounts = trial.filter(
    (r) => r.account_type === "asset" && (r.account_code.toLowerCase().startsWith("1") || r.account_name.toLowerCase().includes("cash"))
  );
  const netChange = cashAccounts.reduce((s, r) => s + r.balance, 0);
  return {
    operating: Math.round(netChange * 100) / 100,
    investing: 0,
    financing: 0,
    net_change: Math.round(netChange * 100) / 100,
  };
}
