import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getSalesOrderById } from "@/lib/supabase/queries";
import type { SalesOrder } from "@/lib/supabase/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const so = await getSalesOrderById(orgId, id);
  if (!so) return NextResponse.json({ error: "Sales order not found" }, { status: 404 });

  return NextResponse.json(so);
}

export type UpdateSalesOrderBody = {
  customer_id?: string | null;
  status?: string;
  order_number?: string | null;
  order_date?: string;
  expected_ship_date?: string | null;
  currency?: string | null;
  notes?: string | null;
  items?: { item_id: string; variant_id?: string | null; quantity: number; unit_price: number }[];
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

  const existing = await getSalesOrderById(orgId, id);
  if (!existing) return NextResponse.json({ error: "Sales order not found" }, { status: 404 });

  let body: UpdateSalesOrderBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (body.customer_id !== undefined) payload.customer_id = body.customer_id?.trim() || null;
  if (body.status !== undefined) payload.status = body.status?.trim() || "draft";
  if (body.order_number !== undefined) payload.order_number = body.order_number?.trim() || null;
  if (body.order_date !== undefined) payload.order_date = body.order_date;
  if (body.expected_ship_date !== undefined) payload.expected_ship_date = body.expected_ship_date?.trim() || null;
  if (body.currency !== undefined) payload.currency = body.currency?.trim() || null;
  if (body.notes !== undefined) payload.notes = body.notes?.trim() || null;

  if (Array.isArray(body.items)) {
    await supabase.from("sales_order_items").delete().eq("sales_order_id", id).eq("tenant_id", orgId);
    let total_amount: number | null = null;
    for (const line of body.items) {
      if (!line?.item_id || typeof line.quantity !== "number" || typeof line.unit_price !== "number") continue;
      await supabase.from("sales_order_items").insert({
        tenant_id: orgId,
        sales_order_id: id,
        item_id: line.item_id,
        variant_id: line.variant_id?.trim() || null,
        quantity: line.quantity,
        unit_price: line.unit_price,
      });
      total_amount = (total_amount ?? 0) + line.quantity * line.unit_price;
    }
    payload.total_amount = total_amount;
  }

  if (Object.keys(payload).length > 0) {
    const { error } = await supabase
      .from("sales_orders")
      .update(payload)
      .eq("id", id)
      .eq("tenant_id", orgId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const so = await getSalesOrderById(orgId, id);
  return NextResponse.json(so as SalesOrder);
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

  const existing = await getSalesOrderById(orgId, id);
  if (!existing) return NextResponse.json({ error: "Sales order not found" }, { status: 404 });

  await supabase.from("sales_order_items").delete().eq("sales_order_id", id).eq("tenant_id", orgId);
  const { error } = await supabase.from("sales_orders").delete().eq("id", id).eq("tenant_id", orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
