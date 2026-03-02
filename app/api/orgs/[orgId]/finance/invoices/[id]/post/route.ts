import { NextResponse } from "next/server";
import { getTenantById, getFinanceAccounts } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { postInvoice } from "@/lib/finance/ledger";

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
  const byType = (t: string) => accounts.find((a) => a.type === t)?.id;
  const ar = byType("asset"); // AR is typically an asset subtype; use first asset for default
  const revenue = byType("income");
  const taxPayable = accounts.find((a) => a.type === "liability")?.id;
  if (!ar || !revenue) {
    return NextResponse.json(
      { error: "Chart of accounts must have at least one asset (AR) and one income (revenue) account" },
      { status: 400 }
    );
  }

  try {
    const entry = await postInvoice(supabase, orgId, user.id, id, {
      ar_account_id: ar,
      revenue_account_id: revenue,
      tax_payable_account_id: taxPayable ?? undefined,
      ap_account_id: ar,
      expense_account_id: revenue,
      cash_account_id: ar,
    });
    return NextResponse.json(entry);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to post invoice";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
