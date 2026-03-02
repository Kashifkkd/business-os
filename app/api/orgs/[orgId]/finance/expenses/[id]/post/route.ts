import { NextResponse } from "next/server";
import { getTenantById, getFinanceAccounts } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { postExpenseReport } from "@/lib/finance/ledger";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { items: accounts } = await getFinanceAccounts(orgId, { page: 1, pageSize: 500 });
  const expense = accounts.find((a) => a.type === "expense")?.id;
  const liability = accounts.find((a) => a.type === "liability")?.id;
  const cash = accounts.find((a) => a.type === "asset")?.id;
  if (!expense || !cash) {
    return NextResponse.json(
      { error: "Chart of accounts must have at least one expense and one asset (cash) account" },
      { status: 400 }
    );
  }

  try {
    const entry = await postExpenseReport(supabase, orgId, user.id, id, {
      expense_account_id: expense,
      expense_liability_account_id: liability ?? undefined,
      cash_account_id: cash,
    });
    return NextResponse.json(entry);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to post expense report";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
