import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { IndustryType, Listing, MenuItem, Profile, Property, TenantRole } from "@/lib/supabase/types";

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
      "id, tenant_id, name, description, long_description, price, discounted_price, sub_category_id, food_type, images, sort_order, is_active, dietary_tags, allergens, prep_time_minutes, sku, unit, stock_quantity, minimum_stock, minimum_order, deleted_at, created_at, updated_at"
    )
    .eq("tenant_id", tenantId)
    .eq("id", itemId)
    .is("deleted_at", null)
    .single();

  if (error || !row) return null;
  const item = row as MenuItem & { sub_category_id?: string | null };
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
  "id, tenant_id, name, description, long_description, price, discounted_price, sub_category_id, food_type, images, sort_order, is_active, dietary_tags, allergens, prep_time_minutes, sku, unit, stock_quantity, minimum_stock, minimum_order, deleted_at, created_at, updated_at";

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
  return {
    items,
    total,
    page,
    pageSize,
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
