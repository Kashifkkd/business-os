import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById } from "@/lib/supabase/queries";

async function getItemGroupById(tenantId: string, groupId: string) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory_item_groups")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", groupId)
    .single();
  return data;
}

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

  const group = await getItemGroupById(orgId, id);
  if (!group) {
    return NextResponse.json({ error: "Item group not found" }, { status: 404 });
  }

  return NextResponse.json(group);
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

  const existing = await getItemGroupById(orgId, id);
  if (!existing) {
    return NextResponse.json({ error: "Item group not found" }, { status: 404 });
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
  if (body.sort_order !== undefined) payload.sort_order = Number(body.sort_order) ?? 0;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(existing);
  }

  const { data: updated, error } = await supabase
    .from("inventory_item_groups")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(updated);
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

  const existing = await getItemGroupById(orgId, id);
  if (!existing) {
    return NextResponse.json({ error: "Item group not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("inventory_item_groups")
    .delete()
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return new NextResponse(null, { status: 204 });
}
