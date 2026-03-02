import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getInventoryItemById, getWarehouses } from "@/lib/supabase/queries";

/** GET stock levels for an item across warehouses */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) {
    return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const item = await getInventoryItemById(orgId, id);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: levels } = await supabase
    .from("inventory_stock_levels")
    .select("id, warehouse_id, quantity")
    .eq("tenant_id", orgId)
    .eq("item_id", id);

  const warehouses = await getWarehouses(orgId);
  const whMap = new Map(warehouses.map((w) => [w.id, w.name]));

  const stockLevels = (levels ?? []).map((l) => ({
    id: l.id,
    warehouse_id: l.warehouse_id,
    warehouse_name: whMap.get(l.warehouse_id) ?? "",
    quantity: Number(l.quantity),
  }));

  const totalQuantity = stockLevels.reduce((sum, s) => sum + s.quantity, 0);

  return NextResponse.json({
    item_id: id,
    item_name: item.name,
    total_quantity: totalQuantity,
    by_warehouse: stockLevels,
  });
}

export type AdjustStockBody = {
  warehouse_id: string;
  quantity_delta: number;
  reason?: string | null;
};

/** POST adjust stock (creates movement and updates level) */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) {
    return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const item = await getInventoryItemById(orgId, id);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  let body: AdjustStockBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const warehouseId = typeof body.warehouse_id === "string" ? body.warehouse_id.trim() : "";
  const quantityDelta = Number(body.quantity_delta);

  if (!warehouseId) {
    return NextResponse.json({ error: "warehouse_id is required" }, { status: 400 });
  }
  if (Number.isNaN(quantityDelta) || quantityDelta === 0) {
    return NextResponse.json({ error: "quantity_delta must be non-zero" }, { status: 400 });
  }

  const { data: existingLevel } = await supabase
    .from("inventory_stock_levels")
    .select("id, quantity")
    .eq("tenant_id", orgId)
    .eq("item_id", id)
    .eq("warehouse_id", warehouseId)
    .single();

  const currentQty = existingLevel ? Number(existingLevel.quantity) : 0;
  const newQty = currentQty + quantityDelta;

  if (newQty < 0) {
    return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
  }

  if (existingLevel) {
    await supabase
      .from("inventory_stock_levels")
      .update({ quantity: newQty })
      .eq("id", existingLevel.id);
  } else {
    await supabase.from("inventory_stock_levels").insert({
      tenant_id: orgId,
      item_id: id,
      warehouse_id: warehouseId,
      quantity: newQty,
    });
  }

  const { data: movement } = await supabase
    .from("inventory_stock_movements")
    .insert({
      tenant_id: orgId,
      item_id: id,
      warehouse_id: warehouseId,
      quantity: quantityDelta,
      movement_type: quantityDelta > 0 ? "adjustment_in" : "adjustment_out",
      reference_type: "adjustment",
      reason: body.reason?.trim() || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (movement?.id) {
    try {
      const { getFinanceAccounts } = await import("@/lib/supabase/queries");
      const { postInventoryMovement } = await import("@/lib/finance/ledger");
      const { items: accounts } = await getFinanceAccounts(orgId, { page: 1, pageSize: 500 });
      const invAccount = accounts.find((a) => a.type === "asset" && (a.subtype === "inventory" || a.name.toLowerCase().includes("inventory")))?.id ?? accounts.find((a) => a.type === "asset")?.id;
      const expenseAccount = accounts.find((a) => a.type === "expense")?.id;
      if (invAccount && expenseAccount) {
        await postInventoryMovement(supabase, orgId, user.id, movement.id, {
          inventory_account_id: invAccount,
          cogs_account_id: expenseAccount,
          expense_account_id: expenseAccount,
        });
      }
    } catch {
      // Finance posting optional; stock adjustment already succeeded
    }
  }

  return NextResponse.json({
    item_id: id,
    warehouse_id: warehouseId,
    previous_quantity: currentQty,
    quantity_delta: quantityDelta,
    new_quantity: newQty,
  });
}
