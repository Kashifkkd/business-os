import { NextResponse } from "next/server";
import { getTenantById, getBankAccounts } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

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

  const data = await getBankAccounts(orgId, { page, pageSize });
  return NextResponse.json(data);
}

export type CreateBankAccountBody = {
  name: string;
  institution?: string | null;
  account_number_masked?: string | null;
  currency?: string;
  linked_gl_account_id: string;
  opening_balance?: number;
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: CreateBankAccountBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const linked_gl_account_id = typeof body.linked_gl_account_id === "string" ? body.linked_gl_account_id.trim() : "";
  if (!name || !linked_gl_account_id)
    return NextResponse.json({ error: "name and linked_gl_account_id are required" }, { status: 400 });

  const payload = {
    tenant_id: orgId,
    name,
    institution: body.institution?.trim() || null,
    account_number_masked: body.account_number_masked?.trim() || null,
    currency: body.currency?.trim() || tenant.currency || "USD",
    linked_gl_account_id,
    opening_balance: Number(body.opening_balance) || 0,
  };

  const { data: row, error } = await supabase
    .from("bank_accounts")
    .insert(payload)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(row, { status: 201 });
}
