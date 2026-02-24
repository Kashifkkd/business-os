import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById } from "@/lib/supabase/queries";

export interface CafeDashboardStats {
  menuItemsCount: number;
  categoriesCount: number;
  subcategoriesCount: number;
  discountsCount: number;
  ordersCount: number;
  totalRevenueCents: number;
  ordersByStatus: Record<string, number>;
  ordersLast7Days: { date: string; count: number }[];
  revenueLast7Days: { date: string; totalCents: number }[];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant || tenant.industry !== "cafe") {
    return NextResponse.json({ error: "Not found or not a cafe" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fromDate = sevenDaysAgo.toISOString();

  const [
    menuItemsResult,
    categoriesResult,
    subcategoriesResult,
    discountsResult,
    ordersResult,
    ordersByStatusResult,
    ordersLast7Result,
  ] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", orgId)
      .is("deleted_at", null),
    supabase
      .from("menu_categories")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", orgId),
    supabase
      .from("menu_sub_categories")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", orgId),
    supabase
      .from("menu_discounts")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", orgId),
    supabase
      .from("orders")
      .select("id, status, total_cents, created_at")
      .eq("tenant_id", orgId),
    supabase
      .from("orders")
      .select("status")
      .eq("tenant_id", orgId),
    supabase
      .from("orders")
      .select("id, total_cents, created_at")
      .eq("tenant_id", orgId)
      .gte("created_at", fromDate),
  ]);

  const orders = (ordersResult.data ?? []) as { id: string; status: string; total_cents: number | null; created_at: string }[];
  const ordersFor7 = (ordersLast7Result.data ?? []) as { id: string; total_cents: number | null; created_at: string }[];

  const totalRevenueCents = orders.reduce((sum, o) => sum + (o.total_cents ?? 0), 0);
  const ordersByStatus: Record<string, number> = {};
  for (const o of ordersByStatusResult.data ?? []) {
    const s = (o as { status: string }).status ?? "unknown";
    ordersByStatus[s] = (ordersByStatus[s] ?? 0) + 1;
  }

  const dateToKey = (d: Date) => d.toISOString().slice(0, 10);
  const last7Dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last7Dates.push(dateToKey(d));
  }
  const ordersByDate = new Map<string, number>();
  const revenueByDate = new Map<string, number>();
  for (const d of last7Dates) {
    ordersByDate.set(d, 0);
    revenueByDate.set(d, 0);
  }
  for (const o of ordersFor7) {
    const key = dateToKey(new Date(o.created_at));
    if (ordersByDate.has(key)) {
      ordersByDate.set(key, (ordersByDate.get(key) ?? 0) + 1);
      revenueByDate.set(key, (revenueByDate.get(key) ?? 0) + (o.total_cents ?? 0));
    }
  }

  const ordersLast7Days = last7Dates.map((date) => ({ date, count: ordersByDate.get(date) ?? 0 }));
  const revenueLast7Days = last7Dates.map((date) => ({
    date,
    totalCents: revenueByDate.get(date) ?? 0,
  }));

  const payload: CafeDashboardStats = {
    menuItemsCount: menuItemsResult.count ?? 0,
    categoriesCount: categoriesResult.count ?? 0,
    subcategoriesCount: subcategoriesResult.count ?? 0,
    discountsCount: discountsResult.count ?? 0,
    ordersCount: orders.length,
    totalRevenueCents,
    ordersByStatus,
    ordersLast7Days,
    revenueLast7Days,
  };

  return NextResponse.json(payload);
}
