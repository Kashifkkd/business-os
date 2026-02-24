import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById } from "@/lib/supabase/queries";
import type { PropertySubCategory } from "@/lib/supabase/types";

export interface PropertySubCategoryWithCategory extends PropertySubCategory {
  category_name?: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant || tenant.industry !== "real_estate") {
    return NextResponse.json(
      { error: "Not found or not a real estate org" },
      { status: 404 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("category_id") ?? undefined;

  let query = supabase
    .from("property_sub_categories")
    .select(
      "id, tenant_id, category_id, name, sort_order, created_at, updated_at"
    )
    .eq("tenant_id", orgId)
    .order("sort_order")
    .order("name");

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data: rows, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const list = (rows ?? []) as PropertySubCategoryWithCategory[];
  if (list.length === 0) {
    return NextResponse.json(list);
  }

  const categoryIds = [...new Set(list.map((r) => r.category_id))];
  const { data: cats } = await supabase
    .from("property_categories")
    .select("id, name")
    .in("id", categoryIds);

  const catMap = new Map(
    (cats ?? []).map((c: { id: string; name: string }) => [c.id, c.name])
  );
  const withCategory = list.map((r) => ({
    ...r,
    category_name: catMap.get(r.category_id) ?? null,
  }));

  return NextResponse.json(withCategory);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant || tenant.industry !== "real_estate") {
    return NextResponse.json(
      { error: "Not found or not a real estate org" },
      { status: 404 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { category_id?: string; name?: string; sort_order?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const category_id = body.category_id;
  if (!category_id || typeof category_id !== "string") {
    return NextResponse.json(
      { error: "category_id is required" },
      { status: 400 }
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data: cat } = await supabase
    .from("property_categories")
    .select("id")
    .eq("id", category_id)
    .eq("tenant_id", orgId)
    .single();

  if (!cat) {
    return NextResponse.json({ error: "Category not found" }, { status: 400 });
  }

  const sort_order =
    typeof body.sort_order === "number" ? body.sort_order : 0;

  const { data: row, error } = await supabase
    .from("property_sub_categories")
    .insert({ tenant_id: orgId, category_id, name, sort_order })
    .select(
      "id, tenant_id, category_id, name, sort_order, created_at, updated_at"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(row as PropertySubCategory, { status: 201 });
}
