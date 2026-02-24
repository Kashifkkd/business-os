import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getMenuItemsPaginated, getMenuItemById } from "@/lib/supabase/queries";
import type { MenuItem } from "@/lib/supabase/types";

/** GET paginated menu items. Query: page, pageSize, search */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant || tenant.industry !== "cafe") {
    return NextResponse.json({ error: "Not found or not a cafe" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 10));
  const search = (searchParams.get("search") ?? "").trim() || undefined;

  const data = await getMenuItemsPaginated(orgId, { page, pageSize, search });
  return NextResponse.json(data);
}

export type CreateMenuItemBody = {
  name: string;
  description?: string | null;
  long_description?: string | null;
  price: number;
  discounted_price?: number | null;
  sub_category_id?: string | null;
  food_type?: "veg" | "non_veg";
  images?: string[];
  sort_order?: number;
  is_active?: boolean;
  sku?: string | null;
  stock_quantity?: number | null;
  minimum_stock?: number | null;
  minimum_order?: number | null;
  dietary_tags?: string[];
  allergens?: string[];
  prep_time_minutes?: number | null;
  unit?: string | null;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
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

  let body: CreateMenuItemBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const price = Number(body.price);
  if (Number.isNaN(price) || price < 0) {
    return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
  }

  const foodType = body.food_type === "non_veg" ? "non_veg" : "veg";
  const sub_category_id =
    typeof body.sub_category_id === "string" && body.sub_category_id.trim()
      ? body.sub_category_id.trim()
      : null;

  const payload = {
    tenant_id: orgId,
    name,
    description: body.description?.trim() || null,
    long_description: body.long_description?.trim() || null,
    price,
    discounted_price: body.discounted_price != null ? Number(body.discounted_price) : null,
    sub_category_id,
    food_type: foodType,
    images: Array.isArray(body.images) ? body.images : [],
    sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
    is_active: body.is_active !== false,
    sku: body.sku?.trim() || null,
    stock_quantity: body.stock_quantity != null ? Number(body.stock_quantity) : null,
    minimum_stock: body.minimum_stock != null ? Number(body.minimum_stock) : null,
    minimum_order: body.minimum_order != null ? Number(body.minimum_order) : 1,
    dietary_tags: Array.isArray(body.dietary_tags) ? body.dietary_tags : [],
    allergens: Array.isArray(body.allergens) ? body.allergens : [],
    prep_time_minutes: body.prep_time_minutes != null ? Number(body.prep_time_minutes) : null,
    unit: body.unit?.trim() || null,
  };

  const { data: row, error } = await supabase
    .from("menu_items")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const item = await getMenuItemById(orgId, row.id);
  return NextResponse.json(item as MenuItem, { status: 201 });
}
