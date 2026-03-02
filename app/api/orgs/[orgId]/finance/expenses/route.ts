import { NextResponse } from "next/server";
import { getTenantById, getExpenseReports } from "@/lib/supabase/queries";
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
  const status = searchParams.get("status") || undefined;

  const data = await getExpenseReports(orgId, { page, pageSize, status });
  return NextResponse.json(data);
}

export type CreateExpenseReportBody = {
  employee_id: string;
  report_number: string;
  currency?: string;
  lines: Array<{
    category_account_id: string;
    description: string;
    expense_date: string;
    amount: number;
    tax_rate_id?: string | null;
    receipt_url?: string | null;
  }>;
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

  let body: CreateExpenseReportBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const employee_id = typeof body.employee_id === "string" ? body.employee_id.trim() : "";
  const report_number = typeof body.report_number === "string" ? body.report_number.trim() : "";
  if (!employee_id || !report_number)
    return NextResponse.json({ error: "employee_id and report_number are required" }, { status: 400 });

  const lines = Array.isArray(body.lines) ? body.lines : [];
  let total_amount = 0;
  for (const line of lines) {
    total_amount += Number(line.amount) || 0;
  }
  const currency = body.currency?.trim() || tenant.currency || "USD";

  const { data: report, error: reportErr } = await supabase
    .from("expense_reports")
    .insert({
      tenant_id: orgId,
      employee_id,
      report_number,
      status: "draft",
      currency,
      total_amount: Math.round(total_amount * 100) / 100,
    })
    .select("id")
    .single();

  if (reportErr || !report)
    return NextResponse.json({ error: reportErr?.message ?? "Failed to create expense report" }, { status: 400 });

  for (const line of lines) {
    await supabase.from("expense_lines").insert({
      tenant_id: orgId,
      expense_report_id: report.id,
      category_account_id: line.category_account_id,
      description: typeof line.description === "string" ? line.description : "Expense",
      expense_date: typeof line.expense_date === "string" ? line.expense_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      amount: Number(line.amount) || 0,
      tax_rate_id: line.tax_rate_id?.trim() || null,
      receipt_url: line.receipt_url?.trim() || null,
    });
  }

  const { getExpenseReportById } = await import("@/lib/supabase/queries");
  const created = await getExpenseReportById(orgId, report.id);
  return NextResponse.json(created, { status: 201 });
}
