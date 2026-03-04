import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getInventoryVendorBillById } from "@/lib/supabase/queries";
import type { VendorBill } from "@/lib/supabase/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bill = await getInventoryVendorBillById(orgId, id);
  if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

  return NextResponse.json(bill);
}

export type UpdateVendorBillBody = {
  bill_number?: string | null;
  bill_date?: string;
  due_date?: string | null;
  currency?: string | null;
  amount?: number;
  status?: string;
  notes?: string | null;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getInventoryVendorBillById(orgId, id);
  if (!existing) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

  let body: UpdateVendorBillBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (body.bill_number !== undefined) payload.bill_number = body.bill_number?.trim() || null;
  if (body.bill_date !== undefined) payload.bill_date = body.bill_date;
  if (body.due_date !== undefined) payload.due_date = body.due_date?.trim() || null;
  if (body.currency !== undefined) payload.currency = body.currency?.trim() || null;
  if (body.amount !== undefined) payload.amount = body.amount;
  if (body.status !== undefined) payload.status = body.status?.trim() || "open";
  if (body.notes !== undefined) payload.notes = body.notes?.trim() || null;

  if (Object.keys(payload).length === 0) return NextResponse.json(existing);

  const { error } = await supabase
    .from("vendor_bills")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const bill = await getInventoryVendorBillById(orgId, id);
  return NextResponse.json(bill as VendorBill);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getInventoryVendorBillById(orgId, id);
  if (!existing) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

  const { error } = await supabase.from("vendor_bills").delete().eq("id", id).eq("tenant_id", orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
