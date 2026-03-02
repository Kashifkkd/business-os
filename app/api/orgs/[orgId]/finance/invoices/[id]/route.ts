import { NextResponse } from "next/server";
import { getTenantById, getInvoiceById, getFinanceAccounts } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { postInvoice } from "@/lib/finance/ledger";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const invoice = await getInvoiceById(orgId, id);
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PATCH(
  request: Request,
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

  const existing = await getInvoiceById(orgId, id);
  if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.status === "string" && ["draft", "sent", "paid", "void"].includes(body.status))
    payload.status = body.status;
  if (typeof body.invoice_date === "string") payload.invoice_date = body.invoice_date.slice(0, 10);
  if (typeof body.due_date === "string") payload.due_date = body.due_date.slice(0, 10) || null;
  if (body.due_date === null) payload.due_date = null;
  if (typeof body.notes === "string") payload.notes = body.notes.trim() || null;
  if (body.customer_id !== undefined) payload.customer_id = body.customer_id && typeof body.customer_id === "string" ? body.customer_id.trim() : null;

  if (Object.keys(payload).length === 0) return NextResponse.json(existing);

  const { error } = await supabase
    .from("invoices")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const updated = await getInvoiceById(orgId, id);

  if (payload.status === "sent") {
    const { items: accounts } = await getFinanceAccounts(orgId, { page: 1, pageSize: 500 });
    const byType = (t: string) => accounts.find((a) => a.type === t)?.id;
    const ar = byType("asset");
    const revenue = byType("income");
    const taxPayable = accounts.find((a) => a.type === "liability")?.id;
    if (ar && revenue) {
      try {
        await postInvoice(supabase, orgId, user.id, id, {
          ar_account_id: ar,
          revenue_account_id: revenue,
          tax_payable_account_id: taxPayable ?? undefined,
          ap_account_id: ar,
          expense_account_id: revenue,
          cash_account_id: ar,
        });
      } catch {
        // Already posted or COA missing; client can use Post to ledger button
      }
    }
  }

  return NextResponse.json(await getInvoiceById(orgId, id));
}
