import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getCompositeItemById } from "@/lib/supabase/queries";
import type { CompositeItem } from "@/lib/supabase/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const composite = await getCompositeItemById(orgId, id);
  if (!composite) return NextResponse.json({ error: "Composite item not found" }, { status: 404 });

  return NextResponse.json(composite);
}

export type UpdateCompositeItemBody = {
  name?: string;
  description?: string | null;
  components?: { item_id: string; variant_id?: string | null; quantity: number }[];
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getCompositeItemById(orgId, id);
  if (!existing) return NextResponse.json({ error: "Composite item not found" }, { status: 404 });

  let body: UpdateCompositeItemBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (body.name !== undefined) payload.name = body.name?.trim() || "";
  if (body.description !== undefined) payload.description = body.description?.trim() || null;

  if (Array.isArray(body.components)) {
    await supabase.from("composite_item_components").delete().eq("composite_id", id).eq("tenant_id", orgId);
    for (const comp of body.components) {
      if (!comp?.item_id || typeof comp.quantity !== "number") continue;
      await supabase.from("composite_item_components").insert({
        tenant_id: orgId,
        composite_id: id,
        item_id: comp.item_id,
        variant_id: comp.variant_id?.trim() || null,
        quantity: comp.quantity,
      });
    }
  }

  if (Object.keys(payload).length > 0) {
    const { error } = await supabase
      .from("composite_items")
      .update(payload)
      .eq("id", id)
      .eq("tenant_id", orgId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const composite = await getCompositeItemById(orgId, id);
  return NextResponse.json(composite as CompositeItem);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getCompositeItemById(orgId, id);
  if (!existing) return NextResponse.json({ error: "Composite item not found" }, { status: 404 });

  await supabase.from("composite_item_components").delete().eq("composite_id", id).eq("tenant_id", orgId);
  const { error } = await supabase.from("composite_items").delete().eq("id", id).eq("tenant_id", orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
