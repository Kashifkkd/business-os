import { NextResponse } from "next/server";
import { getTenantById, getJournalEntries } from "@/lib/supabase/queries";

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
  const status = searchParams.get("status") || undefined;
  const from_date = searchParams.get("from_date") || undefined;
  const to_date = searchParams.get("to_date") || undefined;

  const data = await getJournalEntries(orgId, {
    page,
    pageSize,
    status,
    from_date,
    to_date,
  });
  return NextResponse.json(data);
}
