import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getWarehouses, getWarehouseById } from "@/lib/supabase/queries";
import type { Warehouse } from "@/lib/supabase/types";

/** GET all warehouses */
export async function GET(
  _request: Request,
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

  const warehouses = await getWarehouses(orgId);
  return NextResponse.json(warehouses);
}

export type CreateWarehouseBody = {
  name: string;
  code?: string | null;
  is_default?: boolean;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state_or_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
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

  let body: CreateWarehouseBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (body.is_default) {
    await supabase
      .from("warehouses")
      .update({ is_default: false })
      .eq("tenant_id", orgId);
  }

  const payload = {
    tenant_id: orgId,
    name,
    code: body.code?.trim() || null,
    is_default: Boolean(body.is_default),
    address_line_1: body.address_line_1?.trim() || null,
    address_line_2: body.address_line_2?.trim() || null,
    city: body.city?.trim() || null,
    state_or_province: body.state_or_province?.trim() || null,
    postal_code: body.postal_code?.trim() || null,
    country: body.country?.trim() || null,
  };

  const { data: row, error } = await supabase
    .from("warehouses")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const warehouse = await getWarehouseById(orgId, row.id);
  return NextResponse.json(warehouse as Warehouse, { status: 201 });
}
