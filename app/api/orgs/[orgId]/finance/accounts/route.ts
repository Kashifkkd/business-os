import { NextResponse } from "next/server";
import { getTenantById, getFinanceAccounts } from "@/lib/supabase/queries";

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
  const search = searchParams.get("search")?.trim() || undefined;
  const type = searchParams.get("type") || undefined;
  const is_active = searchParams.get("is_active");
  const isActive =
    is_active === undefined ? undefined : is_active === "true" || is_active === "1";

  const data = await getFinanceAccounts(orgId, {
    page,
    pageSize,
    search,
    type,
    is_active: isActive,
  });
  return NextResponse.json(data);
}

export type CreateFinanceAccountBody = {
  code: string;
  name: string;
  type: string;
  subtype?: string | null;
  is_active?: boolean;
  parent_account_id?: string | null;
  tax_rate_id?: string | null;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await (await import("@/lib/supabase/server")).createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: CreateFinanceAccountBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const validTypes = ["asset", "liability", "equity", "income", "expense"];
  if (!code || !name || !validTypes.includes(type)) {
    return NextResponse.json(
      { error: "code, name, and type (asset|liability|equity|income|expense) are required" },
      { status: 400 }
    );
  }

  const payload = {
    tenant_id: orgId,
    code,
    name,
    type,
    subtype: body.subtype?.trim() || null,
    is_active: body.is_active !== false,
    parent_account_id: body.parent_account_id?.trim() || null,
    tax_rate_id: body.tax_rate_id?.trim() || null,
  };

  const { data: row, error } = await supabase
    .from("accounts")
    .insert(payload)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(row, { status: 201 });
}
