import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getInventoryItems, getInventoryItemById } from "@/lib/supabase/queries";
import type { InventoryItem } from "@/lib/supabase/types";

/** GET paginated inventory items. Query: page, pageSize, search */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 10));
  const search = (searchParams.get("search") ?? "").trim() || undefined;

  const data = await getInventoryItems(orgId, { page, pageSize, search });
  return NextResponse.json(data);
}

export type CreateInventoryItemBody = {
  name: string;
  sku?: string | null;
  description?: string | null;
  unit?: string | null;
  group_id?: string | null;
  is_active?: boolean;
  reorder_level?: number | null;
  cost?: number | null;
  selling_price?: number | null;
  tax_rate?: number | null;
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

  let body: CreateInventoryItemBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const payload = {
    tenant_id: orgId,
    name,
    sku: body.sku?.trim() || null,
    description: body.description?.trim() || null,
    unit: body.unit?.trim() || null,
    group_id: body.group_id?.trim() || null,
    is_active: body.is_active !== false,
    reorder_level: body.reorder_level != null ? Number(body.reorder_level) : null,
    cost: body.cost != null ? Number(body.cost) : null,
    selling_price: body.selling_price != null ? Number(body.selling_price) : null,
    tax_rate: body.tax_rate != null ? Number(body.tax_rate) : null,
  };

  const { data: row, error } = await supabase
    .from("inventory_items")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const item = await getInventoryItemById(orgId, row.id);
  return NextResponse.json(item as InventoryItem, { status: 201 });
}
