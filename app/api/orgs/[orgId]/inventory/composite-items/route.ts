import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getCompositeItems, getCompositeItemById } from "@/lib/supabase/queries";
import type { CompositeItem } from "@/lib/supabase/types";

/** GET paginated composite items. Query: page, pageSize, search */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 10));
  const search = (searchParams.get("search") ?? "").trim() || undefined;

  const data = await getCompositeItems(orgId, { page, pageSize, search });
  return NextResponse.json(data);
}

export type CreateCompositeItemBody = {
  inventory_item_id: string;
  name: string;
  description?: string | null;
  components: { item_id: string; variant_id?: string | null; quantity: number }[];
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: CreateCompositeItemBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.inventory_item_id || typeof body.inventory_item_id !== "string") {
    return NextResponse.json({ error: "inventory_item_id is required" }, { status: 400 });
  }
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { data: compRow, error: cErr } = await supabase
    .from("composite_items")
    .insert({
      tenant_id: orgId,
      inventory_item_id: body.inventory_item_id.trim(),
      name: body.name.trim(),
      description: body.description?.trim() || null,
    })
    .select("id")
    .single();

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 });

  const components = Array.isArray(body.components) ? body.components : [];
  for (const comp of components) {
    if (!comp?.item_id || typeof comp.quantity !== "number") continue;
    await supabase.from("composite_item_components").insert({
      tenant_id: orgId,
      composite_id: compRow.id,
      item_id: comp.item_id,
      variant_id: comp.variant_id?.trim() || null,
      quantity: comp.quantity,
    });
  }

  const composite = await getCompositeItemById(orgId, compRow.id);
  return NextResponse.json(composite as CompositeItem, { status: 201 });
}
