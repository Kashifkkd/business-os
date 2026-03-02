import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getWarehouseById } from "@/lib/supabase/queries";
import type { Warehouse } from "@/lib/supabase/types";

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

  const warehouse = await getWarehouseById(orgId, id);
  if (!warehouse) {
    return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
  }

  return NextResponse.json(warehouse);
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

  const existing = await getWarehouseById(orgId, id);
  if (!existing) {
    return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
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
  if (body.code !== undefined) payload.code = typeof body.code === "string" ? body.code.trim() || null : null;
  if (body.is_default !== undefined) {
    payload.is_default = Boolean(body.is_default);
    if (body.is_default) {
      await supabase
        .from("warehouses")
        .update({ is_default: false })
        .eq("tenant_id", orgId)
        .neq("id", id);
    }
  }
  if (body.address_line_1 !== undefined) payload.address_line_1 = typeof body.address_line_1 === "string" ? body.address_line_1.trim() || null : null;
  if (body.address_line_2 !== undefined) payload.address_line_2 = typeof body.address_line_2 === "string" ? body.address_line_2.trim() || null : null;
  if (body.city !== undefined) payload.city = typeof body.city === "string" ? body.city.trim() || null : null;
  if (body.state_or_province !== undefined) payload.state_or_province = typeof body.state_or_province === "string" ? body.state_or_province.trim() || null : null;
  if (body.postal_code !== undefined) payload.postal_code = typeof body.postal_code === "string" ? body.postal_code.trim() || null : null;
  if (body.country !== undefined) payload.country = typeof body.country === "string" ? body.country.trim() || null : null;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(existing);
  }

  const { error } = await supabase
    .from("warehouses")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const warehouse = await getWarehouseById(orgId, id);
  return NextResponse.json(warehouse as Warehouse);
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

  const existing = await getWarehouseById(orgId, id);
  if (!existing) {
    return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("warehouses")
    .delete()
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return new NextResponse(null, { status: 204 });
}
