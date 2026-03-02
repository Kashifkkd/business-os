import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById, getVendorById } from "@/lib/supabase/queries";
import type { Vendor } from "@/lib/supabase/types";

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

  const vendor = await getVendorById(orgId, id);
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  return NextResponse.json(vendor);
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

  const existing = await getVendorById(orgId, id);
  if (!existing) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
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
  if (body.email !== undefined) payload.email = typeof body.email === "string" ? body.email.trim() || null : null;
  if (body.phone !== undefined) payload.phone = typeof body.phone === "string" ? body.phone.trim() || null : null;
  if (body.address_line_1 !== undefined) payload.address_line_1 = typeof body.address_line_1 === "string" ? body.address_line_1.trim() || null : null;
  if (body.address_line_2 !== undefined) payload.address_line_2 = typeof body.address_line_2 === "string" ? body.address_line_2.trim() || null : null;
  if (body.city !== undefined) payload.city = typeof body.city === "string" ? body.city.trim() || null : null;
  if (body.state_or_province !== undefined) payload.state_or_province = typeof body.state_or_province === "string" ? body.state_or_province.trim() || null : null;
  if (body.postal_code !== undefined) payload.postal_code = typeof body.postal_code === "string" ? body.postal_code.trim() || null : null;
  if (body.country !== undefined) payload.country = typeof body.country === "string" ? body.country.trim() || null : null;
  if (body.payment_terms !== undefined) payload.payment_terms = typeof body.payment_terms === "string" ? body.payment_terms.trim() || null : null;
  if (body.notes !== undefined) payload.notes = typeof body.notes === "string" ? body.notes.trim() || null : null;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(existing);
  }

  const { error } = await supabase
    .from("vendors")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const vendor = await getVendorById(orgId, id);
  return NextResponse.json(vendor as Vendor);
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

  const existing = await getVendorById(orgId, id);
  if (!existing) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("vendors")
    .delete()
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return new NextResponse(null, { status: 204 });
}
