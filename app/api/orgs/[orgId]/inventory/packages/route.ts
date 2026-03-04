import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getInventoryPackages, getInventoryPackageById } from "@/lib/supabase/queries";
import type { InventoryPackage } from "@/lib/supabase/types";

/** GET paginated packages. Query: page, pageSize, status */
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
  const status = (searchParams.get("status") ?? "").trim() || undefined;

  const data = await getInventoryPackages(orgId, { page, pageSize, status });
  return NextResponse.json(data);
}

export type CreatePackageBody = {
  picklist_id: string;
  carrier?: string | null;
  tracking_number?: string | null;
  status?: string;
  notes?: string | null;
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

  let body: CreatePackageBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.picklist_id || typeof body.picklist_id !== "string") {
    return NextResponse.json({ error: "picklist_id is required" }, { status: 400 });
  }

  const { data: row, error } = await supabase
    .from("packages")
    .insert({
      tenant_id: orgId,
      picklist_id: body.picklist_id.trim(),
      carrier: body.carrier?.trim() || null,
      tracking_number: body.tracking_number?.trim() || null,
      status: (body.status?.trim() as string) || "pending",
      notes: body.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const pkg = await getInventoryPackageById(orgId, row.id);
  return NextResponse.json(pkg as InventoryPackage, { status: 201 });
}
