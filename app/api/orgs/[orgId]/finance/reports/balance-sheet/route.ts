import { NextResponse } from "next/server";
import { getTenantById } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { getBalanceSheet } from "@/lib/finance/reports";

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const as_of = searchParams.get("as_of") ?? new Date().toISOString().slice(0, 10);

  try {
    const report = await getBalanceSheet(supabase, orgId, as_of);
    return NextResponse.json({ as_of, ...report });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate balance sheet";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
