import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getInventoryVendorBills, getInventoryVendorBillById } from "@/lib/supabase/queries";
import type { VendorBill } from "@/lib/supabase/types";

/** GET paginated vendor bills. Query: page, pageSize, search, status */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 10));
  const search = (searchParams.get("search") ?? "").trim() || undefined;
  const status = (searchParams.get("status") ?? "").trim() || undefined;

  const data = await getInventoryVendorBills(orgId, { page, pageSize, search, status });
  return NextResponse.json(data);
}

export type CreateVendorBillBody = {
  vendor_id: string;
  purchase_order_id?: string | null;
  bill_number?: string | null;
  bill_date: string;
  due_date?: string | null;
  currency?: string | null;
  amount: number;
  status?: string;
  notes?: string | null;
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: CreateVendorBillBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.vendor_id || typeof body.vendor_id !== "string") {
    return NextResponse.json({ error: "vendor_id is required" }, { status: 400 });
  }
  if (!body.bill_date || typeof body.bill_date !== "string") {
    return NextResponse.json({ error: "bill_date is required" }, { status: 400 });
  }
  if (typeof body.amount !== "number") {
    return NextResponse.json({ error: "amount is required" }, { status: 400 });
  }

  const { data: row, error } = await supabase
    .from("vendor_bills")
    .insert({
      tenant_id: orgId,
      vendor_id: body.vendor_id.trim(),
      purchase_order_id: body.purchase_order_id?.trim() || null,
      bill_number: body.bill_number?.trim() || null,
      bill_date: body.bill_date,
      due_date: body.due_date?.trim() || null,
      currency: body.currency?.trim() || null,
      amount: body.amount,
      status: (body.status?.trim() as string) || "open",
      notes: body.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const bill = await getInventoryVendorBillById(orgId, row.id);
  return NextResponse.json(bill as VendorBill, { status: 201 });
}
