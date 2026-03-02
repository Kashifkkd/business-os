import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getInventoryItemById } from "@/lib/supabase/queries";
import type { InventoryItem } from "@/lib/supabase/types";

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

  return NextResponse.json(item);
}

export async function PATCH(
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

  const existing = await getInventoryItemById(orgId, id);
  if (!existing) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const nameTrim = body.name.trim();
    if (!nameTrim) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    payload.name = nameTrim;
  }
  if (body.sku !== undefined) payload.sku = typeof body.sku === "string" ? body.sku.trim() || null : null;
  if (body.description !== undefined) payload.description = typeof body.description === "string" ? body.description.trim() || null : null;
  if (body.unit !== undefined) payload.unit = typeof body.unit === "string" ? body.unit.trim() || null : null;
  if (body.group_id !== undefined) payload.group_id = typeof body.group_id === "string" && body.group_id.trim() ? body.group_id.trim() : null;
  if (body.is_active !== undefined) payload.is_active = Boolean(body.is_active);
  if (body.reorder_level !== undefined) payload.reorder_level = body.reorder_level != null ? Number(body.reorder_level) : null;
  if (body.cost !== undefined) payload.cost = body.cost != null ? Number(body.cost) : null;
  if (body.selling_price !== undefined) payload.selling_price = body.selling_price != null ? Number(body.selling_price) : null;
  if (body.tax_rate !== undefined) payload.tax_rate = body.tax_rate != null ? Number(body.tax_rate) : null;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(existing);
  }

  const { error } = await supabase
    .from("inventory_items")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const item = await getInventoryItemById(orgId, id);
  return NextResponse.json(item as InventoryItem);
}

export async function DELETE(
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getInventoryItemById(orgId, id);
  if (!existing) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("inventory_items")
    .delete()
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return new NextResponse(null, { status: 204 });
}
