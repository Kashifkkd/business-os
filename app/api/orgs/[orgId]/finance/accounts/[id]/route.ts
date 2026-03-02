import { NextResponse } from "next/server";
import { getTenantById, getFinanceAccountById } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const account = await getFinanceAccountById(orgId, id);
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });
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

  const existing = await getFinanceAccountById(orgId, id);
  if (!existing) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.code === "string") payload.code = body.code.trim();
  if (typeof body.name === "string") payload.name = body.name.trim();
  const validTypes = ["asset", "liability", "equity", "income", "expense"];
  if (typeof body.type === "string" && validTypes.includes(body.type.trim()))
    payload.type = body.type.trim();
  if (body.subtype !== undefined) payload.subtype = typeof body.subtype === "string" ? body.subtype.trim() || null : null;
  if (body.is_active !== undefined) payload.is_active = Boolean(body.is_active);
  if (body.parent_account_id !== undefined) payload.parent_account_id = body.parent_account_id && typeof body.parent_account_id === "string" ? body.parent_account_id.trim() : null;
  if (body.tax_rate_id !== undefined) payload.tax_rate_id = body.tax_rate_id && typeof body.tax_rate_id === "string" ? body.tax_rate_id.trim() : null;

  if (Object.keys(payload).length === 0) return NextResponse.json(existing);

  const { error } = await supabase
    .from("accounts")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const updated = await getFinanceAccountById(orgId, id);
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

  const existing = await getFinanceAccountById(orgId, id);
  if (!existing) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const { error } = await supabase.from("accounts").delete().eq("id", id).eq("tenant_id", orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
