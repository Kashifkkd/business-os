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

/** RESO-aligned high-level property type. */
export type PropertyType = "residential" | "commercial" | "land" | "industrial" | string;

export interface Property {
  id: string;
  tenant_id: string;
  address: string;
  type: string | null;
  created_at: string;
  updated_at: string;
  // Structured address
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state_or_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  // Classification
  property_type?: PropertyType | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  // Core characteristics
  bedrooms?: number | null;
  bathrooms?: number | null;
  half_baths?: number | null;
  living_area_sqft?: number | null;
  lot_size_sqft?: number | null;
  year_built?: number | null;
  // Identifiers and extensibility
  parcel_number?: string | null;
  reference_id?: string | null;
  features?: Record<string, unknown> | null;
  // Optional metadata
  notes?: string | null;
  created_by?: string | null;
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

/** Lead source option per tenant (from lead_sources table). Seeded when org is created. */
export interface LeadSource {
  id: string;
  tenant_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type LeadActivityType = "note" | "email" | "call" | "status_change";

export interface LeadActivity {
  id: string;
  tenant_id: string;
  lead_id: string;
  type: LeadActivityType;
  content: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
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

// ——— Employees module (cross-industry) ———

export interface Department {
  id: string;
  tenant_id: string;
  name: string;
  code: string | null;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Designation {
  id: string;
  tenant_id: string;
  name: string;
  department_id: string | null;
  sort_order: number;
  level: number | null;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  tenant_id: string;
  profile_id: string | null;
  department_id: string;
  designation_id: string;
  reports_to_id: string | null;
  employee_number: string | null;
  join_date: string | null;
  leave_date: string | null;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  /** Populated on read from departments.name */
  department_name?: string | null;
  /** Populated on read from designations.name */
  designation_name?: string | null;
  /** Populated on read from profiles or reports_to employee */
  display_name?: string | null;
  /** Populated on read: reports_to employee display name */
  reports_to_name?: string | null;
}

// ——— Tasks module (cross-industry) ———

export type TaskSpaceRole = "admin" | "member" | "viewer";

export interface TaskSpace {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TaskList {
  id: string;
  space_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type TaskStatusType = "todo" | "in_progress" | "done";

export interface TaskStatus {
  id: string;
  tenant_id: string;
  space_id: string | null;
  name: string;
  type: TaskStatusType;
  sort_order: number;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskLabel {
  id: string;
  tenant_id: string;
  space_id: string | null;
  name: string;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type TaskPriority = "urgent" | "high" | "medium" | "low" | "none";

export interface Task {
  id: string;
  tenant_id: string;
  space_id: string;
  list_id: string;
  parent_id: string | null;
  status_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  due_date: string | null;
  start_date: string | null;
  sort_order: number;
  custom_fields: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  /** Populated on read */
  status_name?: string | null;
  status_type?: TaskStatusType | null;
  list_name?: string | null;
  space_name?: string | null;
  assignee_ids?: string[];
  label_ids?: string[];
  labels?: TaskLabel[];
  subtask_count?: number;
}

export interface TaskAssignee {
  task_id: string;
  user_id: string;
  created_at: string;
}

export interface TaskComment {
  id: string;
  tenant_id: string;
  task_id: string;
  parent_id: string | null;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  /** Populated on read */
  author_name?: string | null;
}

export interface TaskAttachment {
  id: string;
  tenant_id: string;
  task_id: string;
  name: string;
  storage_path: string;
  content_type: string | null;
  size_bytes: number | null;
  created_at: string;
  created_by: string | null;
}

export type TaskActivityAction =
  | "created"
  | "updated"
  | "status_changed"
  | "assignee_added"
  | "assignee_removed"
  | "comment_added";

export interface TaskActivity {
  id: string;
  tenant_id: string;
  task_id: string;
  actor_id: string | null;
  action_type: TaskActivityAction;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  /** Populated on read */
  actor_name?: string | null;
}

export interface SpaceMember {
  id: string;
  space_id: string;
  user_id: string;
  role: TaskSpaceRole;
  created_at: string;
}
