import { NextResponse } from "next/server";
import { getTenantById } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("tenant_account_defaults")
    .select("*")
    .eq("tenant_id", orgId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? {});
}

export type PutDefaultsBody = {
  ar_account_id?: string | null;
  revenue_account_id?: string | null;
  tax_payable_account_id?: string | null;
  ap_account_id?: string | null;
  expense_account_id?: string | null;
  cash_account_id?: string | null;
  expense_liability_account_id?: string | null;
  inventory_account_id?: string | null;
  cogs_account_id?: string | null;
  fx_gains_losses_account_id?: string | null;
};

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: PutDefaultsBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload: Record<string, string | null> = {
    tenant_id: orgId,
    ar_account_id: body.ar_account_id?.trim() || null,
    revenue_account_id: body.revenue_account_id?.trim() || null,
    tax_payable_account_id: body.tax_payable_account_id?.trim() || null,
    ap_account_id: body.ap_account_id?.trim() || null,
    expense_account_id: body.expense_account_id?.trim() || null,
    cash_account_id: body.cash_account_id?.trim() || null,
    expense_liability_account_id: body.expense_liability_account_id?.trim() || null,
    inventory_account_id: body.inventory_account_id?.trim() || null,
    cogs_account_id: body.cogs_account_id?.trim() || null,
    fx_gains_losses_account_id: body.fx_gains_losses_account_id?.trim() || null,
  };

  const { data, error } = await supabase
    .from("tenant_account_defaults")
    .upsert(payload, { onConflict: "tenant_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
