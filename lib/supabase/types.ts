/**
 * Data model: In this app, "organization" = "tenant".
 * All org details (name, industry, logo_url, localization) live in the tenants table.
 * Localization is stored on the tenant; we keep a separate "Localization" settings tab for UI only.
 */
export type IndustryType = "cafe" | "real_estate";

export type TenantRole = "owner" | "admin" | "member";

export type TimeFormatPreference = "12h" | "24h";

export interface Tenant {
  id: string;
  name: string;
  industry: IndustryType;
  settings: Record<string, unknown>;
  logo_url: string | null;
  /** Localization: stored on tenant (same table as org). */
  timezone: string;
  date_format: string;
  time_format: TimeFormatPreference;
  currency: string;
  currency_symbol: string;
  number_format: string;
  language: string;
  country: string;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  /** Phone in E.164 (e.g. +14155551234). Stored in auth (phone + OTP). Optional. */
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: TenantRole;
  created_at: string;
}

export interface TenantWithMember extends Tenant {
  tenant_members?: { role: TenantRole }[];
}

export type FoodType = "veg" | "non_veg";

export interface MenuCategory {
  id: string;
  tenant_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MenuSubCategory {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type MenuDiscountType = "percentage" | "fixed";

export interface MenuDiscount {
  id: string;
  tenant_id: string;
  name: string;
  type: MenuDiscountType;
  value: number;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  long_description: string | null;
  price: number;
  discounted_price: number | null;
  /** Populated on read from sub_category → category */
  category: string | null;
  /** Populated on read from sub_categories.name */
  sub_category: string | null;
  /** Stored; used for write */
  sub_category_id?: string | null;
  food_type: FoodType;
  images: string[];
  sort_order: number;
  is_active: boolean;
  dietary_tags: string[];
  allergens: string[];
  prep_time_minutes: number | null;
  sku: string | null;
  unit: string | null;
  stock_quantity: number | null;
  minimum_stock: number | null;
  minimum_order: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyCategory {
  id: string;
  tenant_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PropertySubCategory {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  tenant_id: string;
  address: string;
  type: string | null;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  tenant_id: string;
  property_id: string | null;
  status: string;
  title: string | null;
  price: number | null;
  description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  /** Populated when joined with properties (e.g. in list). */
  property_address?: string | null;
}

/** MVP status values; stored as TEXT for future tenant-specific stages. */
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";

export interface Lead {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: LeadStatus;
  notes: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Locale/format fields on tenant (for forms). Same as tenant locale columns. */
export type TenantLocaleUpdate = Partial<{
  timezone: string;
  date_format: string;
  time_format: TimeFormatPreference;
  currency: string;
  currency_symbol: string;
  number_format: string;
  language: string;
  country: string;
  locale: string;
}>;
