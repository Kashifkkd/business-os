import { NextResponse } from "next/server";
import { getTenantById, getExpenseReportById } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const report = await getExpenseReportById(orgId, id);
  if (!report) return NextResponse.json({ error: "Expense report not found" }, { status: 404 });
  return NextResponse.json(report);
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

  const existing = await getExpenseReportById(orgId, id);
  if (!existing) return NextResponse.json({ error: "Expense report not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.status === "string" && ["draft", "submitted", "approved", "paid"].includes(body.status))
    payload.status = body.status;
  if (body.status === "submitted") payload.submitted_at = new Date().toISOString();
  if (body.status === "approved") payload.approved_at = new Date().toISOString();

  if (Object.keys(payload).length === 0) return NextResponse.json(existing);

  const { error } = await supabase
    .from("expense_reports")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const updated = await getExpenseReportById(orgId, id);
  return NextResponse.json(updated);
}
