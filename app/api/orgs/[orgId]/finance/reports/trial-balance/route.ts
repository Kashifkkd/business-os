import { NextResponse } from "next/server";
import { getTenantById } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { getTrialBalance } from "@/lib/finance/reports";

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from_date = searchParams.get("from_date") ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const to_date = searchParams.get("to_date") ?? new Date().toISOString().slice(0, 10);

  try {
    const rows = await getTrialBalance(supabase, orgId, from_date, to_date);
    return NextResponse.json({ from_date, to_date, rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate trial balance";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
