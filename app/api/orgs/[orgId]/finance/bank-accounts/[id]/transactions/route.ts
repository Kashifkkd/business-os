import { NextResponse } from "next/server";
import { getTenantById, getBankAccountById } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export interface GetBankTransactionsResult {
  items: Array<{
    id: string;
    tenant_id: string;
    bank_account_id: string;
    transaction_date: string;
    amount: number;
    currency: string;
    description: string | null;
    reference: string | null;
    status: string;
    matched_journal_entry_id: string | null;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bankAccount = await getBankAccountById(orgId, id);
  if (!bankAccount) return NextResponse.json({ error: "Bank account not found" }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 10));
  const status = searchParams.get("status") || undefined;

  let q = supabase
    .from("bank_transactions")
    .select("id, tenant_id, bank_account_id, transaction_date, amount, currency, description, reference, status, matched_journal_entry_id, created_at, updated_at", { count: "exact" })
    .eq("tenant_id", orgId)
    .eq("bank_account_id", id);

  if (status) q = q.eq("status", status);
  q = q.order("transaction_date", { ascending: false });

  const from = (page - 1) * pageSize;
  const { data: rows, error, count } = await q.range(from, from + pageSize - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const result: GetBankTransactionsResult = {
    items: (rows ?? []) as GetBankTransactionsResult["items"],
    total: count ?? 0,
    page,
    pageSize,
  };
  return NextResponse.json(result);
}
