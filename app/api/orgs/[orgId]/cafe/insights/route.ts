import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById } from "@/lib/supabase/queries";

export interface ItemsByCategoryItem {
  categoryName: string;
  count: number;
}

export interface TimeSeriesPoint {
  date: string;
  count: number;
  totalCents?: number;
}

export interface CafeInsightsData {
  itemsByCategory: ItemsByCategoryItem[];
  ordersOverTime: TimeSeriesPoint[];
  revenueOverTime: TimeSeriesPoint[];
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
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate = thirtyDaysAgo.toISOString();

  const [menuItemsResult, ordersResult] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id, sub_category_id")
      .eq("tenant_id", orgId)
      .is("deleted_at", null),
    supabase
      .from("orders")
      .select("id, total_cents, created_at")
      .eq("tenant_id", orgId)
      .gte("created_at", fromDate),
  ]);

  const menuItems = (menuItemsResult.data ?? []) as { id: string; sub_category_id: string | null }[];
  const orders = (ordersResult.data ?? []) as { id: string; total_cents: number | null; created_at: string }[];

  const subIds = [...new Set(menuItems.map((m) => m.sub_category_id).filter(Boolean))] as string[];
  const categoryCountBySubId = new Map<string, string>();
  if (subIds.length > 0) {
    const { data: subRows } = await supabase
      .from("menu_sub_categories")
      .select("id, name, category_id")
      .in("id", subIds);
    const catIds = [...new Set((subRows ?? []).map((s: { category_id: string }) => s.category_id))];
    const { data: catRows } = await supabase
      .from("menu_categories")
      .select("id, name")
      .in("id", catIds);
    const catMap = new Map((catRows ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));
    for (const s of subRows ?? []) {
      const sub = s as { id: string; category_id: string };
      categoryCountBySubId.set(sub.id, catMap.get(sub.category_id) ?? "Uncategorized");
    }
  }

  const categoryCounts = new Map<string, number>();
  for (const m of menuItems) {
    const name = m.sub_category_id
      ? (categoryCountBySubId.get(m.sub_category_id) ?? "Uncategorized")
      : "Uncategorized";
    categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + 1);
  }
  const itemsByCategory: ItemsByCategoryItem[] = Array.from(categoryCounts.entries())
    .map(([categoryName, count]) => ({ categoryName, count }))
    .sort((a, b) => b.count - a.count);

  const dateToKey = (d: Date) => d.toISOString().slice(0, 10);
  const last30Dates: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last30Dates.push(dateToKey(d));
  }
  const ordersByDate = new Map<string, number>();
  const revenueByDate = new Map<string, number>();
  for (const d of last30Dates) {
    ordersByDate.set(d, 0);
    revenueByDate.set(d, 0);
  }
  for (const o of orders) {
    const key = dateToKey(new Date(o.created_at));
    if (ordersByDate.has(key)) {
      ordersByDate.set(key, (ordersByDate.get(key) ?? 0) + 1);
      revenueByDate.set(key, (revenueByDate.get(key) ?? 0) + (o.total_cents ?? 0));
    }
  }

  const ordersOverTime: TimeSeriesPoint[] = last30Dates.map((date) => ({
    date,
    count: ordersByDate.get(date) ?? 0,
  }));
  const revenueOverTime: TimeSeriesPoint[] = last30Dates.map((date) => ({
    date,
    count: 0,
    totalCents: revenueByDate.get(date) ?? 0,
  }));

  const payload: CafeInsightsData = {
    itemsByCategory,
    ordersOverTime,
    revenueOverTime,
  };

  return NextResponse.json(payload);
}
