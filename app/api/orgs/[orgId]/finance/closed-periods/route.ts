import { NextResponse } from "next/server";
import { getTenantById } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("closed_periods")
    .select("*")
    .eq("tenant_id", orgId)
    .order("period_end_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data ?? [] });
}

export type ClosePeriodBody = { period_end_date: string };

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: ClosePeriodBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const period_end_date = typeof body.period_end_date === "string" ? body.period_end_date.slice(0, 10) : "";
  if (!period_end_date) return NextResponse.json({ error: "period_end_date is required (YYYY-MM-DD)" }, { status: 400 });

  const { data, error } = await supabase
    .from("closed_periods")
    .insert({
      tenant_id: orgId,
      period_end_date,
      closed_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
