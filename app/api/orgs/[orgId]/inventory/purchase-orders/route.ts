import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getPurchaseOrders, getPurchaseOrderById } from "@/lib/supabase/queries";
import type { PurchaseOrder } from "@/lib/supabase/types";

/** GET paginated purchase orders. Query: page, pageSize, search, status */
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

  const data = await getPurchaseOrders(orgId, { page, pageSize, search, status });
  return NextResponse.json(data);
}

export type CreatePurchaseOrderBody = {
  vendor_id: string;
  warehouse_id?: string | null;
  status?: string;
  order_number?: string | null;
  order_date: string;
  expected_date?: string | null;
  currency?: string | null;
  notes?: string | null;
  items: { item_id: string; variant_id?: string | null; quantity: number; unit_cost: number }[];
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

  let body: CreatePurchaseOrderBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.vendor_id || typeof body.vendor_id !== "string") {
    return NextResponse.json({ error: "vendor_id is required" }, { status: 400 });
  }
  if (!body.order_date || typeof body.order_date !== "string") {
    return NextResponse.json({ error: "order_date is required" }, { status: 400 });
  }
  const items = Array.isArray(body.items) ? body.items : [];
  let total_amount: number | null = null;
  for (const line of items) {
    if (!line?.item_id || typeof line.quantity !== "number" || typeof line.unit_cost !== "number") continue;
    total_amount = (total_amount ?? 0) + line.quantity * line.unit_cost;
  }

  const { data: poRow, error: poErr } = await supabase
    .from("purchase_orders")
    .insert({
      tenant_id: orgId,
      vendor_id: body.vendor_id.trim(),
      warehouse_id: body.warehouse_id?.trim() || null,
      status: (body.status?.trim() as string) || "draft",
      order_number: body.order_number?.trim() || null,
      order_date: body.order_date,
      expected_date: body.expected_date?.trim() || null,
      currency: body.currency?.trim() || null,
      total_amount,
      notes: body.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (poErr) return NextResponse.json({ error: poErr.message }, { status: 400 });

  for (const line of items) {
    if (!line?.item_id || typeof line.quantity !== "number" || typeof line.unit_cost !== "number") continue;
    await supabase.from("purchase_order_items").insert({
      tenant_id: orgId,
      purchase_order_id: poRow.id,
      item_id: line.item_id,
      variant_id: line.variant_id?.trim() || null,
      quantity: line.quantity,
      unit_cost: line.unit_cost,
    });
  }

  const po = await getPurchaseOrderById(orgId, poRow.id);
  return NextResponse.json(po as PurchaseOrder, { status: 201 });
}
