import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getVendors, getVendorById } from "@/lib/supabase/queries";
import type { Vendor } from "@/lib/supabase/types";

/** GET all vendors */
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

  const vendors = await getVendors(orgId);
  return NextResponse.json(vendors);
}

export type CreateVendorBody = {
  name: string;
  email?: string | null;
  phone?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state_or_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  payment_terms?: string | null;
  notes?: string | null;
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

  let body: CreateVendorBody;
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
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    address_line_1: body.address_line_1?.trim() || null,
    address_line_2: body.address_line_2?.trim() || null,
    city: body.city?.trim() || null,
    state_or_province: body.state_or_province?.trim() || null,
    postal_code: body.postal_code?.trim() || null,
    country: body.country?.trim() || null,
    payment_terms: body.payment_terms?.trim() || null,
    notes: body.notes?.trim() || null,
  };

  const { data: row, error } = await supabase
    .from("vendors")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const vendor = await getVendorById(orgId, row.id);
  return NextResponse.json(vendor as Vendor, { status: 201 });
}
