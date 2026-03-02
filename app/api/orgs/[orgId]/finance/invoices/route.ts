import { NextResponse } from "next/server";
import { getTenantById, getInvoices } from "@/lib/supabase/queries";
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
  const search = searchParams.get("search")?.trim() || undefined;
  const status = searchParams.get("status") || undefined;

  const data = await getInvoices(orgId, { page, pageSize, search, status });
  return NextResponse.json(data);
}

export type CreateInvoiceBody = {
  customer_id?: string | null;
  invoice_number: string;
  invoice_date?: string;
  due_date?: string | null;
  currency?: string;
  notes?: string | null;
  source_sales_order_id?: string | null;
  lines: Array<{
    item_id?: string | null;
    description: string;
    quantity: number;
    unit_price: number;
    discount?: number;
    tax_rate_id?: string | null;
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

  let body: CreateInvoiceBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const invoice_number = typeof body.invoice_number === "string" ? body.invoice_number.trim() : "";
  if (!invoice_number) return NextResponse.json({ error: "invoice_number is required" }, { status: 400 });

  const lines = Array.isArray(body.lines) ? body.lines : [];
  let subtotal = 0;
  let tax_total = 0;
  const invoice_lines: Array<{ description: string; quantity: number; unit_price: number; discount: number; tax_rate_id: string | null; line_total: number; item_id: string | null }> = [];
  for (const line of lines) {
    const qty = Number(line.quantity) || 0;
    const unit_price = Number(line.unit_price) || 0;
    const discount = Number(line.discount) || 0;
    const line_total = round2(qty * unit_price - discount);
    subtotal += line_total;
    invoice_lines.push({
      description: typeof line.description === "string" ? line.description : "Line",
      quantity: qty,
      unit_price,
      discount,
      tax_rate_id: line.tax_rate_id?.trim() || null,
      line_total,
      item_id: line.item_id?.trim() || null,
    });
  }
  const total = round2(subtotal + tax_total);
  const currency = body.currency?.trim() || tenant.currency || "USD";

  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .insert({
      tenant_id: orgId,
      customer_id: body.customer_id?.trim() || null,
      invoice_number,
      status: "draft",
      invoice_date: body.invoice_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      due_date: body.due_date?.slice(0, 10) || null,
      currency,
      subtotal,
      tax_total: 0,
      discount_total: 0,
      total,
      balance: total,
      notes: body.notes?.trim() || null,
      source_sales_order_id: body.source_sales_order_id?.trim() || null,
    })
    .select("id")
    .single();

  if (invErr || !inv) return NextResponse.json({ error: invErr?.message ?? "Failed to create invoice" }, { status: 400 });

  for (const line of invoice_lines) {
    await supabase.from("invoice_lines").insert({
      tenant_id: orgId,
      invoice_id: inv.id,
      item_id: line.item_id,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unit_price,
      discount: line.discount,
      tax_rate_id: line.tax_rate_id,
      line_total: line.line_total,
    });
  }

  const { getInvoiceById } = await import("@/lib/supabase/queries");
  const created = await getInvoiceById(orgId, inv.id);
  return NextResponse.json(created, { status: 201 });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
