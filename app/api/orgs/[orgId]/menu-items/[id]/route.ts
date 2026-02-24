import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getMenuItemById } from "@/lib/supabase/queries";
import type { MenuItem } from "@/lib/supabase/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) {
    return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant || tenant.industry !== "cafe") {
    return NextResponse.json({ error: "Not found or not a cafe" }, { status: 404 });
  }

  const item = await getMenuItemById(orgId, id);
  if (!item) {
    return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
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
  if (!tenant || tenant.industry !== "cafe") {
    return NextResponse.json({ error: "Not found or not a cafe" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getMenuItemById(orgId, id);
  if (!existing) {
    return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
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
  if (body.description !== undefined) payload.description = typeof body.description === "string" ? body.description.trim() || null : null;
  if (body.long_description !== undefined) payload.long_description = typeof body.long_description === "string" ? body.long_description.trim() || null : null;
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }
    payload.price = price;
  }
  if (body.discounted_price !== undefined) payload.discounted_price = body.discounted_price != null ? Number(body.discounted_price) : null;
  if (body.sub_category_id !== undefined) payload.sub_category_id = typeof body.sub_category_id === "string" && body.sub_category_id.trim() ? body.sub_category_id.trim() : null;
  if (body.food_type !== undefined) payload.food_type = body.food_type === "non_veg" ? "non_veg" : "veg";
  if (body.images !== undefined) payload.images = Array.isArray(body.images) ? body.images : existing.images;
  if (body.sort_order !== undefined) payload.sort_order = Number(body.sort_order) ?? 0;
  if (body.is_active !== undefined) payload.is_active = Boolean(body.is_active);
  if (body.sku !== undefined) payload.sku = typeof body.sku === "string" ? body.sku.trim() || null : null;
  if (body.stock_quantity !== undefined) payload.stock_quantity = body.stock_quantity != null ? Number(body.stock_quantity) : null;
  if (body.minimum_stock !== undefined) payload.minimum_stock = body.minimum_stock != null ? Number(body.minimum_stock) : null;
  if (body.minimum_order !== undefined) payload.minimum_order = body.minimum_order != null ? Math.max(1, Number(body.minimum_order)) : 1;
  if (body.dietary_tags !== undefined) payload.dietary_tags = Array.isArray(body.dietary_tags) ? body.dietary_tags : [];
  if (body.allergens !== undefined) payload.allergens = Array.isArray(body.allergens) ? body.allergens : [];
  if (body.prep_time_minutes !== undefined) payload.prep_time_minutes = body.prep_time_minutes != null ? Number(body.prep_time_minutes) : null;
  if (body.unit !== undefined) payload.unit = typeof body.unit === "string" ? body.unit.trim() || null : null;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(existing);
  }

  const { error } = await supabase
    .from("menu_items")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const item = await getMenuItemById(orgId, id);
  return NextResponse.json(item as MenuItem);
}
