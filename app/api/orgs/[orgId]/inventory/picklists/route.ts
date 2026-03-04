import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getPicklists, getPicklistById } from "@/lib/supabase/queries";
import type { Picklist } from "@/lib/supabase/types";

/** GET paginated picklists. Query: page, pageSize, status */
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

  const data = await getPicklists(orgId, { page, pageSize, status });
  return NextResponse.json(data);
}

export type CreatePicklistBody = {
  sales_order_id: string;
  warehouse_id: string;
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

  let body: CreatePicklistBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.sales_order_id || typeof body.sales_order_id !== "string") {
    return NextResponse.json({ error: "sales_order_id is required" }, { status: 400 });
  }
  if (!body.warehouse_id || typeof body.warehouse_id !== "string") {
    return NextResponse.json({ error: "warehouse_id is required" }, { status: 400 });
  }

  const { data: row, error } = await supabase
    .from("picklists")
    .insert({
      tenant_id: orgId,
      sales_order_id: body.sales_order_id.trim(),
      warehouse_id: body.warehouse_id.trim(),
      status: (body.status?.trim() as string) || "open",
      notes: body.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const picklist = await getPicklistById(orgId, row.id);
  return NextResponse.json(picklist as Picklist, { status: 201 });
}
