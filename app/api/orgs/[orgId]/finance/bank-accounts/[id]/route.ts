import { NextResponse } from "next/server";
import { getTenantById, getBankAccountById } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const account = await getBankAccountById(orgId, id);
  if (!account) return NextResponse.json({ error: "Bank account not found" }, { status: 404 });
  return NextResponse.json(account);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getBankAccountById(orgId, id);
  if (!existing) return NextResponse.json({ error: "Bank account not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.name === "string") payload.name = body.name.trim();
  if (body.institution !== undefined) payload.institution = typeof body.institution === "string" ? body.institution.trim() || null : null;
  if (body.account_number_masked !== undefined) payload.account_number_masked = typeof body.account_number_masked === "string" ? body.account_number_masked.trim() || null : null;
  if (typeof body.currency === "string") payload.currency = body.currency.trim();
  if (typeof body.linked_gl_account_id === "string") payload.linked_gl_account_id = body.linked_gl_account_id.trim();
  if (body.opening_balance !== undefined) payload.opening_balance = Number(body.opening_balance);

  if (Object.keys(payload).length === 0) return NextResponse.json(existing);

  const { error } = await supabase
    .from("bank_accounts")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const updated = await getBankAccountById(orgId, id);
  return NextResponse.json(updated);
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getBankAccountById(orgId, id);
  if (!existing) return NextResponse.json({ error: "Bank account not found" }, { status: 404 });

  const { error } = await supabase.from("bank_accounts").delete().eq("id", id).eq("tenant_id", orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
