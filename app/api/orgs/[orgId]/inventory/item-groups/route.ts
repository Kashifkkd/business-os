import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getInventoryItemGroups } from "@/lib/supabase/queries";
import type { InventoryItemGroup } from "@/lib/supabase/types";

/** GET all item groups */
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

  const groups = await getInventoryItemGroups(orgId);
  return NextResponse.json(groups);
}

export type CreateItemGroupBody = {
  name: string;
  description?: string | null;
  sort_order?: number;
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

  let body: CreateItemGroupBody;
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
    description: body.description?.trim() || null,
    sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
  };

  const { data: row, error } = await supabase
    .from("inventory_item_groups")
    .insert(payload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(row as InventoryItemGroup, { status: 201 });
}
