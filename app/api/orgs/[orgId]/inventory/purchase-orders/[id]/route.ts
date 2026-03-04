import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getPurchaseOrderById } from "@/lib/supabase/queries";
import type { PurchaseOrder } from "@/lib/supabase/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const po = await getPurchaseOrderById(orgId, id);
  if (!po) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });

  return NextResponse.json(po);
}

export type UpdatePurchaseOrderBody = {
  warehouse_id?: string | null;
  status?: string;
  order_number?: string | null;
  order_date?: string;
  expected_date?: string | null;
  currency?: string | null;
  notes?: string | null;
  items?: { item_id: string; variant_id?: string | null; quantity: number; unit_cost: number }[];
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

  const existing = await getPurchaseOrderById(orgId, id);
  if (!existing) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });

  let body: UpdatePurchaseOrderBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (body.warehouse_id !== undefined) payload.warehouse_id = body.warehouse_id?.trim() || null;
  if (body.status !== undefined) payload.status = body.status?.trim() || "draft";
  if (body.order_number !== undefined) payload.order_number = body.order_number?.trim() || null;
  if (body.order_date !== undefined) payload.order_date = body.order_date;
  if (body.expected_date !== undefined) payload.expected_date = body.expected_date?.trim() || null;
  if (body.currency !== undefined) payload.currency = body.currency?.trim() || null;
  if (body.notes !== undefined) payload.notes = body.notes?.trim() || null;

  if (Array.isArray(body.items)) {
    await supabase.from("purchase_order_items").delete().eq("purchase_order_id", id).eq("tenant_id", orgId);
    let total_amount: number | null = null;
    for (const line of body.items) {
      if (!line?.item_id || typeof line.quantity !== "number" || typeof line.unit_cost !== "number") continue;
      await supabase.from("purchase_order_items").insert({
        tenant_id: orgId,
        purchase_order_id: id,
        item_id: line.item_id,
        variant_id: line.variant_id?.trim() || null,
        quantity: line.quantity,
        unit_cost: line.unit_cost,
      });
      total_amount = (total_amount ?? 0) + line.quantity * line.unit_cost;
    }
    payload.total_amount = total_amount;
  }

  if (Object.keys(payload).length > 0) {
    const { error } = await supabase
      .from("purchase_orders")
      .update(payload)
      .eq("id", id)
      .eq("tenant_id", orgId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const po = await getPurchaseOrderById(orgId, id);
  return NextResponse.json(po as PurchaseOrder);
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

  const existing = await getPurchaseOrderById(orgId, id);
  if (!existing) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });

  await supabase.from("purchase_order_items").delete().eq("purchase_order_id", id).eq("tenant_id", orgId);
  const { error } = await supabase.from("purchase_orders").delete().eq("id", id).eq("tenant_id", orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
