import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById } from "@/lib/supabase/queries";
import type { MenuDiscount } from "@/lib/supabase/types";

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

  let body: {
    name?: string;
    type?: "percentage" | "fixed";
    value?: number;
    is_active?: boolean;
    description?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    payload.name = name;
  }
  if (body.type === "fixed" || body.type === "percentage") payload.type = body.type;
  if (typeof body.value === "number" && body.value >= 0) payload.value = body.value;
  if (typeof body.is_active === "boolean") payload.is_active = body.is_active;
  if (body.description !== undefined) {
    payload.description = typeof body.description === "string" ? body.description.trim() || null : null;
  }

  if (Object.keys(payload).length === 0) {
    const { data: existing } = await supabase
      .from("menu_discounts")
      .select("id, tenant_id, name, type, value, is_active, description, created_at, updated_at")
      .eq("id", id)
      .eq("tenant_id", orgId)
      .single();
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(existing as MenuDiscount);
  }

  const { data: row, error } = await supabase
    .from("menu_discounts")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId)
    .select("id, tenant_id, name, type, value, is_active, description, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(row as MenuDiscount);
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

  const { error } = await supabase
    .from("menu_discounts")
    .delete()
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
