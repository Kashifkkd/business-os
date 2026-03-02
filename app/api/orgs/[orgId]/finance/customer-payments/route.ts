import { NextResponse } from "next/server";
import { getTenantById, getFinanceAccounts } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { postCustomerPayment } from "@/lib/finance/ledger";

export type CreateCustomerPaymentBody = {
  customer_id?: string | null;
  payment_date: string;
  amount: number;
  currency?: string;
  method?: string | null;
  reference?: string | null;
  post_to_ledger?: boolean;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: CreateCustomerPaymentBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0)
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });

  const payment_date = typeof body.payment_date === "string" ? body.payment_date.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const currency = body.currency?.trim() || tenant.currency || "USD";

  const { data: payment, error: insertErr } = await supabase
    .from("customer_payments")
    .insert({
      tenant_id: orgId,
      customer_id: body.customer_id?.trim() || null,
      payment_date,
      amount,
      currency,
      method: body.method?.trim() || null,
      reference: body.reference?.trim() || null,
      applied_amount: 0,
    })
    .select("id")
    .single();

  if (insertErr || !payment)
    return NextResponse.json({ error: insertErr?.message ?? "Failed to create payment" }, { status: 400 });

  if (body.post_to_ledger) {
    const { items: accounts } = await getFinanceAccounts(orgId, { page: 1, pageSize: 500 });
    const cash = accounts.find((a) => a.type === "asset")?.id;
    const ar = accounts.find((a) => a.type === "asset")?.id;
    if (cash && ar) {
      try {
        await postCustomerPayment(supabase, orgId, user.id, payment.id, {
          cash_account_id: cash,
          ar_account_id: ar,
        });
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Payment created but failed to post to ledger" },
          { status: 400 }
        );
      }
    }
  }

  const { data: created } = await supabase
    .from("customer_payments")
    .select("*")
    .eq("id", payment.id)
    .single();

  return NextResponse.json(created ?? payment, { status: 201 });
}
