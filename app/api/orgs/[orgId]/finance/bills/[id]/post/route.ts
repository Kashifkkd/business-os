import { NextResponse } from "next/server";
import { getTenantById, getFinanceAccounts } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { postVendorBill } from "@/lib/finance/ledger";

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
  const ap = accounts.find((a) => a.type === "liability")?.id;
  const expense = accounts.find((a) => a.type === "expense")?.id;
  const inventory = accounts.find((a) => a.subtype === "inventory" || a.name.toLowerCase().includes("inventory"))?.id ?? expense;
  if (!ap || !expense) {
    return NextResponse.json(
      { error: "Chart of accounts must have at least one liability (AP) and one expense account" },
      { status: 400 }
    );
  }

  try {
    const entry = await postVendorBill(supabase, orgId, user.id, id, {
      ap_account_id: ap,
      expense_account_id: expense,
      inventory_account_id: inventory ?? undefined,
    });
    return NextResponse.json(entry);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to post bill";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
