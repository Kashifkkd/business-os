import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById } from "@/lib/supabase/queries";
import type { PropertyCategory } from "@/lib/supabase/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) {
    return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant || tenant.industry !== "real_estate") {
    return NextResponse.json({ error: "Not found or not a real estate org" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; sort_order?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload: { name?: string; sort_order?: number } = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    payload.name = name;
  }
  if (typeof body.sort_order === "number") payload.sort_order = body.sort_order;

  if (Object.keys(payload).length === 0) {
    const { data: existing } = await supabase
      .from("property_categories")
      .select("id, tenant_id, name, sort_order, created_at, updated_at")
      .eq("id", id)
      .eq("tenant_id", orgId)
      .single();
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(existing as PropertyCategory);
  }

  const { data: row, error } = await supabase
    .from("property_categories")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId)
    .select("id, tenant_id, name, sort_order, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(row as PropertyCategory);
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
  if (!tenant || tenant.industry !== "real_estate") {
    return NextResponse.json({ error: "Not found or not a real estate org" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count } = await supabase
    .from("property_sub_categories")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if (count != null && count > 0) {
    return NextResponse.json(
      { error: "Cannot delete category that has sub-categories. Delete or move sub-categories first." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("property_categories")
    .delete()
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
