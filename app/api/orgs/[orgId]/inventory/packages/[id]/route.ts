import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getInventoryPackageById } from "@/lib/supabase/queries";
import type { InventoryPackage } from "@/lib/supabase/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pkg = await getInventoryPackageById(orgId, id);
  if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

  return NextResponse.json(pkg);
}

export type UpdatePackageBody = {
  carrier?: string | null;
  tracking_number?: string | null;
  status?: string;
  shipped_at?: string | null;
  delivered_at?: string | null;
  notes?: string | null;
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

  const existing = await getInventoryPackageById(orgId, id);
  if (!existing) return NextResponse.json({ error: "Package not found" }, { status: 404 });

  let body: UpdatePackageBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (body.carrier !== undefined) payload.carrier = body.carrier?.trim() || null;
  if (body.tracking_number !== undefined) payload.tracking_number = body.tracking_number?.trim() || null;
  if (body.status !== undefined) payload.status = body.status?.trim() || "pending";
  if (body.shipped_at !== undefined) payload.shipped_at = body.shipped_at?.trim() || null;
  if (body.delivered_at !== undefined) payload.delivered_at = body.delivered_at?.trim() || null;
  if (body.notes !== undefined) payload.notes = body.notes?.trim() || null;

  if (Object.keys(payload).length === 0) return NextResponse.json(existing);

  const { error } = await supabase
    .from("packages")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const pkg = await getInventoryPackageById(orgId, id);
  return NextResponse.json(pkg as InventoryPackage);
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

  const existing = await getInventoryPackageById(orgId, id);
  if (!existing) return NextResponse.json({ error: "Package not found" }, { status: 404 });

  const { error } = await supabase.from("packages").delete().eq("id", id).eq("tenant_id", orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
