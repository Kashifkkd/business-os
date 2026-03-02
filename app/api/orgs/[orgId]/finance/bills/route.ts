import { NextResponse } from "next/server";
import { getTenantById, getFinanceVendorBills } from "@/lib/supabase/queries";

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
  const status = searchParams.get("status") || undefined;

  const data = await getFinanceVendorBills(orgId, { page, pageSize, search, status });
  return NextResponse.json(data);
}
