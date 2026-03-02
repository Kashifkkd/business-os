import { NextResponse } from "next/server";
import { getTenantById, getFinanceVendorBillById } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bill = await getFinanceVendorBillById(orgId, id);
  if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  return NextResponse.json(bill);
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

  const existing = await getFinanceVendorBillById(orgId, id);
  if (!existing) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.status === "string") payload.status = body.status;
  if (typeof body.bill_date === "string") payload.bill_date = body.bill_date.slice(0, 10);
  if (typeof body.due_date === "string") payload.due_date = body.due_date.slice(0, 10) || null;
  if (body.due_date === null) payload.due_date = null;
  if (typeof body.notes === "string") payload.notes = body.notes.trim() || null;
  if (body.amount !== undefined) payload.amount = Number(body.amount);

  if (Object.keys(payload).length === 0) return NextResponse.json(existing);

  const { error } = await supabase
    .from("vendor_bills")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const updated = await getFinanceVendorBillById(orgId, id);
  return NextResponse.json(updated);
}
