import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  IndustryType,
  Listing,
  MenuItem,
  Profile,
  Property,
  TenantRole,
  InventoryItem,
  InventoryItemGroup,
  Warehouse,
  Vendor,
} from "@/lib/supabase/types";

export interface TenantWithRole {
  id: string;
  name: string;
  industry: IndustryType;
  role: TenantRole;
  logo_url: string | null;
  timezone: string;
  date_format: string;
  time_format: "12h" | "24h";
  currency: string;
  currency_symbol: string;
  number_format: string;
  language: string;
  country: string;
  locale: string;
}

export const getTenantById = cache(async function getTenantById(
  orgId: string
): Promise<TenantWithRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, industry, logo_url, timezone, date_format, time_format, currency, currency_symbol, number_format, language, country, locale")
    .eq("id", orgId)
    .single();

  if (tenantError || !tenant) return null;

  const { data: member, error: memberError } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .single();

  if (memberError || !member) return null;

  return {
    id: tenant.id,
    name: tenant.name,
    industry: tenant.industry as IndustryType,
    role: member.role as TenantRole,
    logo_url: tenant.logo_url ?? null,
    timezone: tenant.timezone ?? "UTC",
    date_format: tenant.date_format ?? "MM/dd/yyyy",
    time_format: (tenant.time_format ?? "12h") as "12h" | "24h",
    currency: tenant.currency ?? "USD",
    currency_symbol: tenant.currency_symbol ?? "$",
    number_format: tenant.number_format ?? "1,234.56",
    language: tenant.language ?? "en",
    country: tenant.country ?? "US",
    locale: tenant.locale ?? "en-US",
  };
});


export async function getUserTenants(): Promise<TenantWithRole[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rows, error } = await supabase
    .from("tenant_members")
    .select(
      `
      role,
      tenants (
        id,
        name,
        industry,
        logo_url,
        timezone,
        date_format,
        time_format,
        currency,
        currency_symbol,
        number_format,
        language,
        country,
        locale
      )
    `
    )
    .eq("user_id", user.id);

  if (error || !rows) return [];

  return rows
    .map((r) => {
      const t = Array.isArray(r.tenants) ? r.tenants[0] : r.tenants;
      if (!t) return null;
      return {
        id: t.id,
        name: t.name,
        industry: t.industry as IndustryType,
        role: r.role as TenantRole,
        logo_url: t.logo_url ?? null,
        timezone: t.timezone ?? "UTC",
        date_format: t.date_format ?? "MM/dd/yyyy",
        time_format: (t.time_format ?? "12h") as "12h" | "24h",
        currency: t.currency ?? "USD",
        currency_symbol: t.currency_symbol ?? "$",
        number_format: t.number_format ?? "1,234.56",
        language: t.language ?? "en",
        country: t.country ?? "US",
        locale: t.locale ?? "en-US",
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);
}

export async function getMenuItemById(
  tenantId: string,
  itemId: string
): Promise<MenuItem | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row, error } = await supabase
    .from("menu_items")
    .select(
      "id, tenant_id, name, description, long_description, price, discounted_price, sub_category_id, food_type, images, sort_order, is_active, dietary_tags, allergens, prep_time_minutes, sku, unit, stock_quantity, minimum_stock, minimum_order, inventory_item_id, deleted_at, created_at, updated_at"
    )
    .eq("tenant_id", tenantId)
    .eq("id", itemId)
    .is("deleted_at", null)
    .single();

  if (error || !row) return null;
  const item = row as MenuItem & { sub_category_id?: string | null; inventory_item_id?: string | null };
  if (item.inventory_item_id) {
    const [{ data: levels }, { data: invRow }] = await Promise.all([
      supabase.from("inventory_stock_levels").select("quantity").eq("item_id", item.inventory_item_id),
      supabase.from("inventory_items").select("reorder_level").eq("id", item.inventory_item_id).single(),
    ]);
    const total = (levels ?? []).reduce((s, l) => s + Number(l.quantity ?? 0), 0);
    (item as MenuItem & { inventory_stock?: number; inventory_reorder_level?: number | null }).inventory_stock = total;
    (item as MenuItem & { inventory_reorder_level?: number | null }).inventory_reorder_level = invRow?.reorder_level ?? null;
  }
  if (item.sub_category_id) {
    const { data: sc } = await supabase
      .from("menu_sub_categories")
      .select("name, category_id")
      .eq("id", item.sub_category_id)
      .single();
    if (sc) {
      (item as MenuItem).sub_category = sc.name;
      const { data: cat } = await supabase
        .from("menu_categories")
        .select("name")
        .eq("id", sc.category_id)
        .single();
      (item as MenuItem).category = cat?.name ?? null;
    }
  } else {
    (item as MenuItem).category = null;
    (item as MenuItem).sub_category = null;
  }
  return item as MenuItem;
}

export async function getMenuItems(tenantId: string): Promise<MenuItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rows, error } = await supabase
    .from("menu_items")
    .select(MENU_ITEMS_SELECT)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("sort_order")
    .order("name");

  if (error || !rows) return [];
  return await enrichMenuItemsWithCategoryNames(supabase, rows as MenuItemRow[]);
}

type MenuItemRow = Record<string, unknown> & { sub_category_id?: string | null };

/** Enrich menu item rows with category and sub_category names from sub_category_id. */
async function enrichMenuItemsWithCategoryNames(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: MenuItemRow[]
): Promise<MenuItem[]> {
  const ids = [...new Set((rows.map((r) => r.sub_category_id).filter(Boolean) as string[]))];
  if (ids.length === 0) {
    return rows.map((r) => ({ ...r, category: null, sub_category: null } as MenuItem));
  }
  const { data: subCats } = await supabase
    .from("menu_sub_categories")
    .select("id, name, category_id")
    .in("id", ids);
  const catIds = [...new Set((subCats ?? []).map((s: { category_id: string }) => s.category_id))];
  const { data: cats } = await supabase
    .from("menu_categories")
    .select("id, name")
    .in("id", catIds);
  const catMap = new Map((cats ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));
  const subMap = new Map(
    (subCats ?? []).map((s: { id: string; name: string; category_id: string }) => [
      s.id,
      { name: s.name, category_name: catMap.get(s.category_id) ?? null },
    ])
  );
  return rows.map((r) => {
    const sub = r.sub_category_id ? subMap.get(r.sub_category_id) : null;
    return {
      ...r,
      category: sub?.category_name ?? null,
      sub_category: sub?.name ?? null,
    } as unknown as MenuItem;
  });
}

export interface MenuCategoryForDropdown {
  id: string;
  name: string;
  sort_order: number;
}

export interface MenuSubCategoryForDropdown {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  sort_order: number;
}

export interface MenuCategoriesResult {
  categories: MenuCategoryForDropdown[];
  subCategories: MenuSubCategoryForDropdown[];
}

/** Categories and sub-categories from tables for dropdowns. */
export async function getMenuCategories(tenantId: string): Promise<MenuCategoriesResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { categories: [], subCategories: [] };

  const { data: categories, error: catError } = await supabase
    .from("menu_categories")
    .select("id, name, sort_order")
    .eq("tenant_id", tenantId)
    .order("sort_order")
    .order("name");

  if (catError || !categories?.length) {
    return { categories: [], subCategories: [] };
  }

  const { data: subRows, error: subError } = await supabase
    .from("menu_sub_categories")
    .select("id, name, category_id, sort_order")
    .eq("tenant_id", tenantId)
    .order("sort_order")
    .order("name");

  if (subError || !subRows?.length) {
    return {
      categories: categories as MenuCategoryForDropdown[],
      subCategories: [],
    };
  }

  const catMap = new Map((categories as { id: string; name: string }[]).map((c) => [c.id, c.name]));
  const subCategories = (subRows as { id: string; name: string; category_id: string; sort_order: number }[]).map(
    (s) => ({
      id: s.id,
      name: s.name,
      category_id: s.category_id,
      category_name: catMap.get(s.category_id) ?? "",
      sort_order: s.sort_order,
    })
  );

  return {
    categories: categories as MenuCategoryForDropdown[],
    subCategories,
  };
}

export interface GetMenuItemsPaginatedParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface GetMenuItemsPaginatedResult {
  items: MenuItem[];
  total: number;
  page: number;
  pageSize: number;
}

const MENU_ITEMS_SELECT =
  "id, tenant_id, name, description, long_description, price, discounted_price, sub_category_id, food_type, images, sort_order, is_active, dietary_tags, allergens, prep_time_minutes, sku, unit, stock_quantity, minimum_stock, minimum_order, inventory_item_id, deleted_at, created_at, updated_at";

export async function getMenuItemsPaginated(
  tenantId: string,
  params: GetMenuItemsPaginatedParams = {}
): Promise<GetMenuItemsPaginatedResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { items: [], total: 0, page: 1, pageSize: 10 };
  }

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10));
  const search = (params.search ?? "").trim();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("menu_items")
    .select(MENU_ITEMS_SELECT, { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("sort_order")
    .order("name");

  if (search) {
    const term = `%${search}%`;
    query = query.or(`name.ilike.${term},description.ilike.${term}`);
  }

  const { data: rows, error, count } = await query.range(from, to);

  if (error) {
    return { items: [], total: 0, page, pageSize };
  }

  const total = count ?? 0;
  const rawItems = (rows ?? []) as MenuItemRow[];
  const items = await enrichMenuItemsWithCategoryNames(supabase, rawItems);
  const itemsWithStock = await enrichMenuItemsWithInventoryStock(supabase, items);
  return {
    items: itemsWithStock,
    total,
    page,
    pageSize,
  };
}

async function enrichMenuItemsWithInventoryStock(
  supabase: Awaited<ReturnType<typeof createClient>>,
  items: MenuItem[]
): Promise<MenuItem[]> {
  const invIds = [...new Set(items.map((i) => i.inventory_item_id).filter(Boolean) as string[])];
  if (invIds.length === 0) return items;

  const [{ data: levels }, { data: invItems }] = await Promise.all([
    supabase.from("inventory_stock_levels").select("item_id, quantity").in("item_id", invIds),
    supabase.from("inventory_items").select("id, reorder_level").in("id", invIds),
  ]);

  const stockByItem = new Map<string, number>();
  for (const l of levels ?? []) {
    stockByItem.set(l.item_id, (stockByItem.get(l.item_id) ?? 0) + Number(l.quantity ?? 0));
  }
  const reorderByItem = new Map((invItems ?? []).map((r) => [r.id, r.reorder_level]));

  return items.map((i) => {
    if (!i.inventory_item_id) return i;
    const stock = stockByItem.get(i.inventory_item_id) ?? 0;
    const reorder = reorderByItem.get(i.inventory_item_id) ?? null;
    return { ...i, inventory_stock: stock, inventory_reorder_level: reorder } as MenuItem;
  });
}

// ——— Inventory: items (server-side helpers for API / dashboards) ———

export interface GetInventoryItemsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface GetInventoryItemsResult {
  items: InventoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getInventoryItems(
  tenantId: string,
  params: GetInventoryItemsParams = {}
): Promise<GetInventoryItemsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { items: [], total: 0, page: 1, pageSize: 10 };
  }

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10));
  const search = (params.search ?? "").trim();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("inventory_items")
    .select(
      "id, tenant_id, group_id, name, sku, description, unit, is_active, reorder_level, cost, selling_price, tax_rate, metadata, created_at, updated_at",
      { count: "exact" }
    )
    .eq("tenant_id", tenantId)
    .order("name");

  if (search) {
    const term = `%${search}%`;
    query = query.or(`name.ilike.${term},sku.ilike.${term},description.ilike.${term}`);
  }

  const { data: rows, error, count } = await query.range(from, to);

  if (error) {
    return { items: [], total: 0, page, pageSize };
  }

  return {
    items: (rows ?? []) as InventoryItem[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getInventoryItemById(
  tenantId: string,
  itemId: string
): Promise<InventoryItem | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row, error } = await supabase
    .from("inventory_items")
    .select(
      "id, tenant_id, group_id, name, sku, description, unit, is_active, reorder_level, cost, selling_price, tax_rate, metadata, created_at, updated_at"
    )
    .eq("tenant_id", tenantId)
    .eq("id", itemId)
    .single();

  if (error || !row) return null;
  return row as InventoryItem;
}

// ——— Inventory: item groups ———

export async function getInventoryItemGroups(tenantId: string): Promise<InventoryItemGroup[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rows, error } = await supabase
    .from("inventory_item_groups")
    .select("id, tenant_id, name, description, sort_order, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("sort_order")
    .order("name");

  if (error || !rows) return [];
  return rows as InventoryItemGroup[];
}

// ——— Inventory: warehouses ———

export async function getWarehouses(tenantId: string): Promise<Warehouse[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rows, error } = await supabase
    .from("warehouses")
    .select(
      "id, tenant_id, name, code, is_default, address_line_1, address_line_2, city, state_or_province, postal_code, country, created_at, updated_at"
    )
    .eq("tenant_id", tenantId)
    .order("name");

  if (error || !rows) return [];
  return rows as Warehouse[];
}

export async function getWarehouseById(
  tenantId: string,
  warehouseId: string
): Promise<Warehouse | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row, error } = await supabase
    .from("warehouses")
    .select(
      "id, tenant_id, name, code, is_default, address_line_1, address_line_2, city, state_or_province, postal_code, country, created_at, updated_at"
    )
    .eq("tenant_id", tenantId)
    .eq("id", warehouseId)
    .single();

  if (error || !row) return null;
  return row as Warehouse;
}

// ——— Inventory: vendors ———

export async function getVendors(tenantId: string): Promise<Vendor[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rows, error } = await supabase
    .from("vendors")
    .select(
      "id, tenant_id, name, email, phone, address_line_1, address_line_2, city, state_or_province, postal_code, country, payment_terms, notes, created_at, updated_at"
    )
    .eq("tenant_id", tenantId)
    .order("name");

  if (error || !rows) return [];
  return rows as Vendor[];
}

export async function getVendorById(
  tenantId: string,
  vendorId: string
): Promise<Vendor | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row, error } = await supabase
    .from("vendors")
    .select(
      "id, tenant_id, name, email, phone, address_line_1, address_line_2, city, state_or_province, postal_code, country, payment_terms, notes, created_at, updated_at"
    )
    .eq("tenant_id", tenantId)
    .eq("id", vendorId)
    .single();

  if (error || !row) return null;
  return row as Vendor;
}

// ——— Inventory: analytics ———

export interface InventoryAnalytics {
  total_items: number;
  low_stock_count: number;
  total_stock_value: number;
  recent_movements: Array<{
    id: string;
    item_id: string;
    item_name: string;
    warehouse_id: string;
    warehouse_name: string;
    quantity: number;
    movement_type: string;
    created_at: string;
  }>;
  low_stock_items: Array<{
    id: string;
    name: string;
    sku: string | null;
    reorder_level: number | null;
    total_quantity: number;
  }>;
}

export async function getInventoryAnalytics(
  tenantId: string
): Promise<InventoryAnalytics> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      total_items: 0,
      low_stock_count: 0,
      total_stock_value: 0,
      recent_movements: [],
      low_stock_items: [],
    };
  }

  const { count: totalItems } = await supabase
    .from("inventory_items")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  const { data: items } = await supabase
    .from("inventory_items")
    .select("id, name, sku, reorder_level, cost")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  const { data: stockLevels } = await supabase
    .from("inventory_stock_levels")
    .select("item_id, quantity")
    .eq("tenant_id", tenantId);

  const itemMap = new Map(
    (items ?? []).map((i) => [i.id, { name: i.name, sku: i.sku, reorder_level: i.reorder_level, cost: i.cost ?? 0 }])
  );

  let totalStockValue = 0;
  const qtyByItem = new Map<string, number>();

  for (const sl of stockLevels ?? []) {
    const qty = Number(sl.quantity) ?? 0;
    const item = itemMap.get(sl.item_id);
    if (item) totalStockValue += qty * item.cost;
    qtyByItem.set(sl.item_id, (qtyByItem.get(sl.item_id) ?? 0) + qty);
  }

  const lowStockItems: InventoryAnalytics["low_stock_items"] = [];
  for (const [itemId, totalQty] of qtyByItem) {
    const item = itemMap.get(itemId);
    if (!item) continue;
    if (item.reorder_level != null && totalQty <= item.reorder_level) {
      lowStockItems.push({
        id: itemId,
        name: item.name,
        sku: item.sku,
        reorder_level: item.reorder_level,
        total_quantity: totalQty,
      });
    }
  }

  const { data: movements } = await supabase
    .from("inventory_stock_movements")
    .select("id, item_id, warehouse_id, quantity, movement_type, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(10);

  const itemIds = [...new Set((movements ?? []).map((m) => m.item_id))];
  const whIds = [...new Set((movements ?? []).map((m) => m.warehouse_id))];

  const { data: itemRows } = itemIds.length
    ? await supabase.from("inventory_items").select("id, name").in("id", itemIds)
    : { data: [] };
  const { data: whRows } = whIds.length
    ? await supabase.from("warehouses").select("id, name").in("id", whIds)
    : { data: [] };

  const itemNameMap = new Map((itemRows ?? []).map((r) => [r.id, r.name]));
  const whNameMap = new Map((whRows ?? []).map((r) => [r.id, r.name]));

  const recent_movements = (movements ?? []).map((m) => ({
    id: m.id,
    item_id: m.item_id,
    item_name: itemNameMap.get(m.item_id) ?? "",
    warehouse_id: m.warehouse_id,
    warehouse_name: whNameMap.get(m.warehouse_id) ?? "",
    quantity: Number(m.quantity),
    movement_type: m.movement_type,
    created_at: m.created_at,
  }));

  return {
    total_items: totalItems ?? 0,
    low_stock_count: lowStockItems.length,
    total_stock_value: totalStockValue,
    recent_movements,
    low_stock_items: lowStockItems,
  };
}

/** Get current user's profile (from profiles table). Cached per request. */
export const getCurrentUserProfile = cache(async function getCurrentUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, avatar_url, phone, created_at, updated_at")
    .eq("id", user.id)
    .single();

  if (error || !profile) return null;
  return profile as Profile;
});

export interface TenantMemberWithProfile {
  id: string;
  tenant_id: string;
  user_id: string;
  role: TenantRole;
  created_at: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}

/** Get members of a tenant with profile info. Cached per request. */
export const getTenantMembers = cache(async function getTenantMembers(
  tenantId: string
): Promise<TenantMemberWithProfile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: members, error: membersError } = await supabase
    .from("tenant_members")
    .select("id, tenant_id, user_id, role, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  if (membersError || !members?.length) return [];

  const userIds = [...new Set(members.map((m) => m.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      {
        email: p.email ?? null,
        first_name: p.first_name ?? null,
        last_name: p.last_name ?? null,
      },
    ])
  );

  return members.map((m) => {
    const p = profileMap.get(m.user_id);
    return {
      id: m.id,
      tenant_id: m.tenant_id,
      user_id: m.user_id,
      role: m.role as TenantRole,
      created_at: m.created_at,
      email: p?.email ?? null,
      first_name: p?.first_name ?? null,
      last_name: p?.last_name ?? null,
    };
  });
});

// ——— Real estate: properties ———

const PROPERTY_SELECT =
  "id, tenant_id, address, type, created_at, updated_at, address_line_1, address_line_2, city, state_or_province, postal_code, country, property_type, category_id, subcategory_id, bedrooms, bathrooms, half_baths, living_area_sqft, lot_size_sqft, year_built, parcel_number, reference_id, features, notes, created_by";

export interface GetPropertiesParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface GetPropertiesResult {
  items: Property[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getProperties(
  tenantId: string,
  params: GetPropertiesParams = {}
): Promise<GetPropertiesResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { items: [], total: 0, page: 1, pageSize: 10 };
  }

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10));
  const search = (params.search ?? "").trim();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("properties")
    .select(PROPERTY_SELECT, { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("address", `%${search}%`);
  }

  const { data: rows, error, count } = await query.range(from, to);

  if (error) {
    return { items: [], total: 0, page, pageSize };
  }

  return {
    items: (rows ?? []) as Property[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getPropertyById(
  tenantId: string,
  propertyId: string
): Promise<Property | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row, error } = await supabase
    .from("properties")
    .select(PROPERTY_SELECT)
    .eq("tenant_id", tenantId)
    .eq("id", propertyId)
    .single();

  if (error || !row) return null;
  return row as Property;
}

// ——— Real estate: listings ———

export interface GetListingsParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

export interface GetListingsResult {
  items: Listing[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getListings(
  tenantId: string,
  params: GetListingsParams = {}
): Promise<GetListingsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { items: [], total: 0, page: 1, pageSize: 10 };
  }

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("listings")
    .select(
      "id, tenant_id, property_id, status, title, price, description, published_at, created_at, updated_at, properties(address)",
      { count: "exact" }
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (params.status?.trim()) {
    query = query.eq("status", params.status.trim());
  }

  const { data: rows, error, count } = await query.range(from, to);

  if (error) {
    return { items: [], total: 0, page, pageSize };
  }

  const items = (rows ?? []).map((row: Record<string, unknown>) => {
    const props = row.properties ?? row.property;
    const property_address =
      props && typeof props === "object" && "address" in props
        ? (props as { address: string }).address
        : null;
    const rest = { ...row };
    delete rest.properties;
    delete rest.property;
    return { ...rest, property_address } as Listing;
  });

  return {
    items,
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getListingById(
  tenantId: string,
  listingId: string
): Promise<Listing | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row, error } = await supabase
    .from("listings")
    .select(
      "id, tenant_id, property_id, status, title, price, description, published_at, created_at, updated_at, properties(address)"
    )
    .eq("tenant_id", tenantId)
    .eq("id", listingId)
    .single();

  if (error || !row) return null;

  const r = row as Record<string, unknown>;
  const props = r.properties ?? r.property;
  const property_address =
    props && typeof props === "object" && "address" in props
      ? (props as { address: string }).address
      : null;
  const rest = { ...r };
  delete rest.properties;
  delete rest.property;
  return { ...rest, property_address } as Listing;
}

// ——— Finance module ———

export interface GetFinanceAccountsResult {
  items: Array<{
    id: string;
    tenant_id: string;
    code: string;
    name: string;
    type: string;
    subtype: string | null;
    is_active: boolean;
    parent_account_id: string | null;
    tax_rate_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

export async function getFinanceAccounts(
  tenantId: string,
  params: { page: number; pageSize: number; search?: string; type?: string; is_active?: boolean }
): Promise<GetFinanceAccountsResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { items: [], total: 0, page: params.page, pageSize: params.pageSize };

  const { page, pageSize, search, type, is_active } = params;
  let q = supabase
    .from("accounts")
    .select("id, tenant_id, code, name, type, subtype, is_active, parent_account_id, tax_rate_id, metadata, created_at, updated_at", { count: "exact" })
    .eq("tenant_id", tenantId);

  if (search?.trim()) {
    q = q.or(`code.ilike.%${search.trim()}%,name.ilike.%${search.trim()}%`);
  }
  if (type) q = q.eq("type", type);
  if (is_active !== undefined) q = q.eq("is_active", is_active);
  q = q.order("code");

  const from = (page - 1) * pageSize;
  const { data: rows, error, count } = await q.range(from, from + pageSize - 1);

  if (error) return { items: [], total: 0, page, pageSize };
  return { items: (rows ?? []) as GetFinanceAccountsResult["items"], total: count ?? 0, page, pageSize };
}

export async function getFinanceAccountById(tenantId: string, accountId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", accountId)
    .single();
  if (error || !data) return null;
  return data;
}

export interface GetJournalEntriesResult {
  items: Array<{
    id: string;
    tenant_id: string;
    entry_number: string;
    entry_date: string;
    source_type: string | null;
    source_id: string | null;
    memo: string | null;
    status: string;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

export async function getJournalEntries(
  tenantId: string,
  params: { page: number; pageSize: number; status?: string; from_date?: string; to_date?: string }
): Promise<GetJournalEntriesResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { items: [], total: 0, page: params.page, pageSize: params.pageSize };

  const { page, pageSize, status, from_date, to_date } = params;
  let q = supabase
    .from("journal_entries")
    .select("id, tenant_id, entry_number, entry_date, source_type, source_id, memo, status, created_by, created_at, updated_at", { count: "exact" })
    .eq("tenant_id", tenantId);

  if (status) q = q.eq("status", status);
  if (from_date) q = q.gte("entry_date", from_date);
  if (to_date) q = q.lte("entry_date", to_date);
  q = q.order("entry_date", { ascending: false });

  const from = (page - 1) * pageSize;
  const { data: rows, error, count } = await q.range(from, from + pageSize - 1);
  if (error) return { items: [], total: 0, page, pageSize };
  return { items: (rows ?? []) as GetJournalEntriesResult["items"], total: count ?? 0, page, pageSize };
}

export async function getJournalEntryById(tenantId: string, entryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: entry, error: eErr } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", entryId)
    .single();
  if (eErr || !entry) return null;
  const { data: lines } = await supabase
    .from("journal_lines")
    .select("*")
    .eq("journal_entry_id", entryId)
    .eq("tenant_id", tenantId)
    .order("id");
  return { ...entry, lines: lines ?? [] };
}

export interface GetInvoicesResult {
  items: Array<{
    id: string;
    tenant_id: string;
    customer_id: string | null;
    invoice_number: string;
    status: string;
    invoice_date: string;
    due_date: string | null;
    currency: string;
    subtotal: number;
    tax_total: number;
    discount_total: number;
    total: number;
    balance: number;
    notes: string | null;
    source_sales_order_id: string | null;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

export async function getInvoices(
  tenantId: string,
  params: { page: number; pageSize: number; search?: string; status?: string }
): Promise<GetInvoicesResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { items: [], total: 0, page: params.page, pageSize: params.pageSize };

  const { page, pageSize, search, status } = params;
  let q = supabase
    .from("invoices")
    .select("id, tenant_id, customer_id, invoice_number, status, invoice_date, due_date, currency, subtotal, tax_total, discount_total, total, balance, notes, source_sales_order_id, created_at, updated_at", { count: "exact" })
    .eq("tenant_id", tenantId);

  if (status) q = q.eq("status", status);
  if (search?.trim()) q = q.ilike("invoice_number", `%${search.trim()}%`);
  q = q.order("invoice_date", { ascending: false });

  const from = (page - 1) * pageSize;
  const { data: rows, error, count } = await q.range(from, from + pageSize - 1);
  if (error) return { items: [], total: 0, page, pageSize };
  return { items: (rows ?? []) as GetInvoicesResult["items"], total: count ?? 0, page, pageSize };
}

export async function getInvoiceById(tenantId: string, invoiceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", invoiceId)
    .single();
  if (invErr || !inv) return null;
  const { data: invLines } = await supabase
    .from("invoice_lines")
    .select("*")
    .eq("invoice_id", invoiceId)
    .eq("tenant_id", tenantId);
  return { ...inv, lines: invLines ?? [] };
}

export interface GetVendorBillsFinanceResult {
  items: Array<{
    id: string;
    tenant_id: string;
    vendor_id: string;
    purchase_order_id: string | null;
    bill_number: string | null;
    bill_date: string;
    due_date: string | null;
    currency: string | null;
    amount: number;
    status: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

export async function getFinanceVendorBills(
  tenantId: string,
  params: { page: number; pageSize: number; search?: string; status?: string }
): Promise<GetVendorBillsFinanceResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { items: [], total: 0, page: params.page, pageSize: params.pageSize };

  const { page, pageSize, search, status } = params;
  let q = supabase
    .from("vendor_bills")
    .select("id, tenant_id, vendor_id, purchase_order_id, bill_number, bill_date, due_date, currency, amount, status, notes, created_at, updated_at", { count: "exact" })
    .eq("tenant_id", tenantId);

  if (status) q = q.eq("status", status);
  if (search?.trim()) q = q.ilike("bill_number", `%${search.trim()}%`);
  q = q.order("bill_date", { ascending: false });

  const from = (page - 1) * pageSize;
  const { data: rows, error, count } = await q.range(from, from + pageSize - 1);
  if (error) return { items: [], total: 0, page, pageSize };
  return { items: (rows ?? []) as GetVendorBillsFinanceResult["items"], total: count ?? 0, page, pageSize };
}

export async function getFinanceVendorBillById(tenantId: string, billId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: bill, error: bErr } = await supabase
    .from("vendor_bills")
    .select("*, vendors(name)")
    .eq("tenant_id", tenantId)
    .eq("id", billId)
    .single();
  if (bErr || !bill) return null;
  const { data: lines } = await supabase
    .from("vendor_bill_lines")
    .select("*")
    .eq("vendor_bill_id", billId)
    .eq("tenant_id", tenantId);
  const vendor_name = bill.vendors && typeof bill.vendors === "object" && "name" in bill.vendors ? (bill.vendors as { name: string }).name : null;
  const { vendors: _v, ...rest } = bill as Record<string, unknown>;
  return { ...rest, vendor_name, lines: lines ?? [] };
}

export interface GetExpenseReportsResult {
  items: Array<{
    id: string;
    tenant_id: string;
    employee_id: string;
    report_number: string;
    status: string;
    currency: string;
    total_amount: number;
    submitted_at: string | null;
    approved_at: string | null;
    paid_at: string | null;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

export async function getExpenseReports(
  tenantId: string,
  params: { page: number; pageSize: number; status?: string }
): Promise<GetExpenseReportsResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { items: [], total: 0, page: params.page, pageSize: params.pageSize };

  const { page, pageSize, status } = params;
  let q = supabase
    .from("expense_reports")
    .select("id, tenant_id, employee_id, report_number, status, currency, total_amount, submitted_at, approved_at, paid_at, created_at, updated_at", { count: "exact" })
    .eq("tenant_id", tenantId);

  if (status) q = q.eq("status", status);
  q = q.order("created_at", { ascending: false });

  const from = (page - 1) * pageSize;
  const { data: rows, error, count } = await q.range(from, from + pageSize - 1);
  if (error) return { items: [], total: 0, page, pageSize };
  return { items: (rows ?? []) as GetExpenseReportsResult["items"], total: count ?? 0, page, pageSize };
}

export async function getExpenseReportById(tenantId: string, reportId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: report, error: rErr } = await supabase
    .from("expense_reports")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", reportId)
    .single();
  if (rErr || !report) return null;
  const { data: lines } = await supabase
    .from("expense_lines")
    .select("*")
    .eq("expense_report_id", reportId)
    .eq("tenant_id", tenantId);
  return { ...report, lines: lines ?? [] };
}

export interface GetBankAccountsResult {
  items: Array<{
    id: string;
    tenant_id: string;
    name: string;
    institution: string | null;
    account_number_masked: string | null;
    currency: string;
    linked_gl_account_id: string;
    opening_balance: number;
    import_source: string | null;
    import_id: string | null;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

export async function getBankAccounts(
  tenantId: string,
  params: { page: number; pageSize: number }
): Promise<GetBankAccountsResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { items: [], total: 0, page: params.page, pageSize: params.pageSize };

  const { page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const { data: rows, error, count } = await supabase
    .from("bank_accounts")
    .select("id, tenant_id, name, institution, account_number_masked, currency, linked_gl_account_id, opening_balance, import_source, import_id, created_at, updated_at", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("name")
    .range(from, from + pageSize - 1);
  if (error) return { items: [], total: 0, page, pageSize };
  return { items: (rows ?? []) as GetBankAccountsResult["items"], total: count ?? 0, page, pageSize };
}

export async function getBankAccountById(tenantId: string, accountId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", accountId)
    .single();
  if (error || !data) return null;
  return data;
}
