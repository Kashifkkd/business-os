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

// ——— Inventory module (cross-industry) ———

export interface InventoryItemGroup {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  tenant_id: string;
  group_id: string | null;
  name: string;
  sku: string | null;
  description: string | null;
  unit: string | null;
  is_active: boolean;
  reorder_level: number | null;
  cost: number | null;
  selling_price: number | null;
  tax_rate: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface InventoryItemVariant {
  id: string;
  tenant_id: string;
  item_id: string;
  name: string;
  sku: string | null;
  attributes: Record<string, unknown>;
  is_active: boolean;
  cost: number | null;
  selling_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  tenant_id: string;
  name: string;
  code: string | null;
  is_default: boolean;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state_or_province: string | null;
  postal_code: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryStockLevel {
  id: string;
  tenant_id: string;
  item_id: string;
  variant_id: string | null;
  warehouse_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryStockMovement {
  id: string;
  tenant_id: string;
  item_id: string;
  variant_id: string | null;
  warehouse_id: string;
  quantity: number;
  movement_type: string;
  reference_type: string | null;
  reference_id: string | null;
  reason: string | null;
  created_at: string;
  created_by: string | null;
}

export interface Vendor {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state_or_province: string | null;
  postal_code: string | null;
  country: string | null;
  payment_terms: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  tenant_id: string;
  vendor_id: string;
  warehouse_id: string | null;
  status: string;
  order_number: string | null;
  order_date: string;
  expected_date: string | null;
  currency: string | null;
  total_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  vendor_name?: string | null;
}

export interface PurchaseOrderItem {
  id: string;
  tenant_id: string;
  purchase_order_id: string;
  item_id: string;
  variant_id: string | null;
  quantity: number;
  unit_cost: number;
  received_quantity: number;
  created_at: string;
  updated_at: string;
  item_name?: string | null;
}

export interface VendorBill {
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
  vendor_name?: string | null;
}

export interface SalesOrder {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  status: string;
  order_number: string | null;
  order_date: string;
  expected_ship_date: string | null;
  currency: string | null;
  total_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesOrderItem {
  id: string;
  tenant_id: string;
  sales_order_id: string;
  item_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
  item_name?: string | null;
}

export interface Picklist {
  id: string;
  tenant_id: string;
  sales_order_id: string;
  warehouse_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  warehouse_name?: string | null;
  sales_order_number?: string | null;
}

export interface InventoryPackage {
  id: string;
  tenant_id: string;
  picklist_id: string;
  carrier: string | null;
  tracking_number: string | null;
  status: string;
  shipped_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompositeItem {
  id: string;
  tenant_id: string;
  inventory_item_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  item_name?: string | null;
}

export interface CompositeItemComponent {
  id: string;
  tenant_id: string;
  composite_id: string;
  item_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
  item_name?: string | null;
}

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
  /** Optional link to inventory_items when using full inventory module. */
  inventory_item_id?: string | null;
  /** Populated when inventory_item_id is set: aggregated stock from inventory_stock_levels. */
  inventory_stock?: number | null;
  /** Populated when inventory_item_id is set: reorder_level from inventory_items. */
  inventory_reorder_level?: number | null;
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
  /** Image URLs (e.g. from Storage); first is primary/cover. */
  images?: string[];
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

/** @deprecated Use stage_id / LeadStage; kept for transition. */
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";

/** Lead stage per tenant (pipeline column). */
export interface LeadStage {
  id: string;
  tenant_id: string;
  name: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

/** Company (tenant-scoped); referenced by leads. */
export interface Company {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  /** Resolved from profiles for display */
  created_by_name?: string | null;
  /** Resolved from profiles for avatar image */
  created_by_avatar_url?: string | null;
  /** Number of leads assigned to this company */
  lead_count?: number;
}

/** Job title (tenant-scoped); used as option list for lead metadata.job_title. */
export interface JobTitle {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  /** Resolved from profiles for display */
  created_by_name?: string | null;
  /** Resolved from profiles for avatar image */
  created_by_avatar_url?: string | null;
  /** Number of leads with this job title (metadata.job_title) */
  lead_count?: number;
}

/** Nested stage on lead (API response). */
export type LeadStageRef = { id: string; name: string };

/** Nested company on lead (API response). */
export type LeadCompanyRef = { id: string; name: string };

/** Nested job title on lead (API response). id is null when lead has job_title text not in job_titles list. */
export type LeadJobTitleRef = { id: string | null; name: string };

export interface Lead {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company_id: string | null;
  /** Resolved from companies.name for display */
  company_name?: string | null;
  /** Nested company (API response). Prefer over company_id/company_name. */
  company?: LeadCompanyRef | null;
  source: string | null;
  /** Source FK (API response); used when creating/updating by id. */
  source_id?: string | null;
  stage_id: string;
  /** Resolved from lead_stages.name for display */
  stage_name?: string | null;
  /** Nested stage (API response). Prefer over stage_id/stage_name. */
  stage?: LeadStageRef | null;
  notes: string | null;
  metadata?: Record<string, unknown>;
  /** Job title (API response). Moved from metadata.job_title. id null if not in job_titles list. */
  job_title?: LeadJobTitleRef | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  /** Resolved from profiles for display */
  created_by_name?: string | null;
  /** Resolved from profiles for avatar image */
  created_by_avatar_url?: string | null;
  /** Assigned member user_ids; resolved to assignees (with name) for display */
  assignee_ids?: string[];
  assignees?: { user_id: string; name: string | null; email: string | null }[];
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

/** Activity / audit log row (tenant-scoped). Used for Logs module. */
export interface ActivityLog {
  id: string;
  tenant_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ——— Activities module (calls, meetings) ———

export type ActivityCallType = "inbound" | "outbound";

export type ActivityCallStatus =
  | "attended"
  | "missed"
  | "busy"
  | "no_answer"
  | "other";

export interface ActivityCall {
  id: string;
  tenant_id: string;
  lead_id: string | null;
  deal_id: string | null;
  subject: string | null;
  description: string | null;
  call_type: ActivityCallType;
  call_status: ActivityCallStatus;
  call_start_time: string;
  duration_seconds: number | null;
  call_result: string | null;
  call_agenda: string | null;
  call_purpose: string | null;
  owner_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  lead_name?: string | null;
  deal_name?: string | null;
  owner_name?: string | null;
}

export interface ActivityMeeting {
  id: string;
  tenant_id: string;
  lead_id: string | null;
  deal_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  venue: string | null;
  all_day: boolean;
  participant_ids: string[];
  owner_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  lead_name?: string | null;
  deal_name?: string | null;
  owner_name?: string | null;
}

// ——— Marketing module (cross-industry) ———

export type MarketingChannel = "email" | "sms" | "whatsapp" | "social";

export type CampaignStatus = "draft" | "scheduled" | "running" | "paused" | "completed";

export interface MarketingCampaign {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  objective: string | null;
  status: CampaignStatus;
  primary_channel: MarketingChannel | null;
  /** Optional budget in smallest currency unit (e.g. cents). */
  budget_amount: number | null;
  budget_currency: string | null;
  starts_at: string | null;
  ends_at: string | null;
  /** Segment id this campaign primarily targets. */
  primary_segment_id: string | null;
  /** Optional owner (profile id or employee id depending on how assignments evolve). */
  owner_id: string | null;
  /** Flexible tags such as industry context (cafe, real_estate) or campaign themes. */
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type MarketingSegmentDefinition = {
  /** Filters are expressed as a JSON-friendly structure, applied against leads/customers. */
  filters: Record<string, unknown>;
};

export interface MarketingSegment {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  definition: MarketingSegmentDefinition;
  /** Cached estimated size when last computed. */
  estimated_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface MarketingTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  channel: MarketingChannel;
  subject: string | null;
  /** Body stored as HTML or markdown depending on channel. */
  body: string;
  /** Variables referenced in the body (e.g. {{lead.name}}). */
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type MarketingJourneyTriggerType =
  | "lead_created"
  | "lead_status_changed"
  | "lead_entered_segment";

export interface MarketingJourneyStep {
  id: string;
  /** Order in which this step executes within the journey. */
  order: number;
  type: "wait" | "send_message" | "update_lead" | "create_task";
  /** Step specific configuration, shape depends on `type`. */
  config: Record<string, unknown>;
}

export interface MarketingJourney {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  status: "draft" | "active" | "paused";
  trigger_type: MarketingJourneyTriggerType;
  /** Optional trigger metadata, e.g. target segment or status transition. */
  trigger_config: Record<string, unknown>;
  /** Linear ordered steps. */
  steps: MarketingJourneyStep[];
  created_at: string;
  updated_at: string;
}

export type MessageSendStatus = "pending" | "scheduled" | "sending" | "sent" | "failed" | "cancelled";

export interface MarketingMessageSend {
  id: string;
  tenant_id: string;
  campaign_id: string | null;
  journey_id: string | null;
  segment_id: string | null;
  template_id: string | null;
  channel: MarketingChannel;
  /** Snapshot of segment definition at send time for auditing. */
  segment_definition_snapshot: MarketingSegmentDefinition | null;
  status: MessageSendStatus;
  send_at: string | null;
  sent_at: string | null;
  provider: string | null;
  provider_message_id: string | null;
  error_code: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type MessageEventType =
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "complained"
  | "unsubscribed"
  | "failed"
  | "replied";

export interface MarketingMessageEvent {
  id: string;
  tenant_id: string;
  message_send_id: string | null;
  campaign_id: string | null;
  journey_id: string | null;
  channel: MarketingChannel;
  type: MessageEventType;
  occurred_at: string;
  /** Provider specific payload for support/debug. */
  provider_payload: Record<string, unknown> | null;
  created_at: string;
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

// ——— Sales module (cross-industry) ———

export interface SalesPipelineStage {
  id: string;
  tenant_id: string;
  name: string;
  sort_order: number;
  is_won: boolean;
  is_lost: boolean;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  tenant_id: string;
  name: string;
  lead_id: string | null;
  stage_id: string;
  owner_id: string | null;
  value: number;
  actual_value: number | null;
  probability: number | null;
  expected_close_date: string | null;
  close_date: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type DealActivityType = "note" | "email" | "call" | "status_change";

export interface DealActivity {
  id: string;
  tenant_id: string;
  deal_id: string;
  type: DealActivityType;
  content: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
}

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  unit_price: number;
  currency: string | null;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DealProduct {
  id: string;
  tenant_id: string;
  deal_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ——— Finance module (GL) ———

export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

export interface Account {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  type: AccountType;
  subtype: string | null;
  is_active: boolean;
  parent_account_id: string | null;
  tax_rate_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type JournalEntryStatus = "draft" | "posted";

export interface JournalEntry {
  id: string;
  tenant_id: string;
  entry_number: string;
  entry_date: string;
  source_type: string | null;
  source_id: string | null;
  memo: string | null;
  status: JournalEntryStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalLine {
  id: string;
  tenant_id: string;
  journal_entry_id: string;
  account_id: string;
  contact_id: string | null;
  debit: number;
  credit: number;
  currency: string;
  fx_rate: number;
  line_memo: string | null;
  dimension_tags: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type TaxRateType = "sales_tax" | "vat" | "gst" | "withholding";

export interface TaxRate {
  id: string;
  tenant_id: string;
  name: string;
  rate: number;
  type: TaxRateType;
  is_compound: boolean;
  country: string | null;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "void";

export interface Invoice {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
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
}

export interface InvoiceLine {
  id: string;
  tenant_id: string;
  invoice_id: string;
  item_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate_id: string | null;
  line_total: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CustomerPayment {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  payment_date: string;
  amount: number;
  currency: string;
  method: string | null;
  reference: string | null;
  applied_amount: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerPaymentApplication {
  id: string;
  tenant_id: string;
  payment_id: string;
  invoice_id: string;
  applied_amount: number;
  created_at: string;
}

export interface VendorBillLine {
  id: string;
  tenant_id: string;
  vendor_bill_id: string;
  item_id: string | null;
  account_id: string | null;
  description: string;
  quantity: number;
  unit_cost: number;
  tax_rate_id: string | null;
  line_total: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface VendorPayment {
  id: string;
  tenant_id: string;
  vendor_id: string;
  payment_date: string;
  amount: number;
  currency: string;
  method: string | null;
  reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorPaymentApplication {
  id: string;
  tenant_id: string;
  payment_id: string;
  bill_id: string;
  applied_amount: number;
  created_at: string;
}

export type ExpenseReportStatus = "draft" | "submitted" | "approved" | "paid";

export interface ExpenseReport {
  id: string;
  tenant_id: string;
  employee_id: string;
  report_number: string;
  status: ExpenseReportStatus;
  currency: string;
  total_amount: number;
  submitted_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseLine {
  id: string;
  tenant_id: string;
  expense_report_id: string;
  category_account_id: string;
  description: string;
  expense_date: string;
  amount: number;
  tax_rate_id: string | null;
  receipt_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
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
}

export type BankTransactionStatus = "unreconciled" | "reconciled";

export interface TenantAccountDefaults {
  id: string;
  tenant_id: string;
  ar_account_id: string | null;
  revenue_account_id: string | null;
  tax_payable_account_id: string | null;
  ap_account_id: string | null;
  expense_account_id: string | null;
  cash_account_id: string | null;
  expense_liability_account_id: string | null;
  inventory_account_id: string | null;
  cogs_account_id: string | null;
  fx_gains_losses_account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClosedPeriod {
  id: string;
  tenant_id: string;
  period_end_date: string;
  closed_at: string;
  closed_by: string | null;
  created_at: string;
}

/** Shape for Tenant.settings.accounting (region-aware config). */
export type TenantAccountingSettings = {
  enabled?: boolean;
  country?: string;
  tax_model?: "sales_tax" | "vat" | "gst" | "generic";
  base_currency?: string;
  fiscal_year_start?: string;
};

export interface BankTransaction {
  id: string;
  tenant_id: string;
  bank_account_id: string;
  transaction_date: string;
  amount: number;
  currency: string;
  description: string | null;
  reference: string | null;
  status: BankTransactionStatus;
  matched_journal_entry_id: string | null;
  import_source: string | null;
  import_id: string | null;
  created_at: string;
  updated_at: string;
}

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
  created_by: string | null;
  /** Resolved from profiles for display */
  created_by_name?: string | null;
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
  created_by: string | null;
  /** Resolved from profiles for display */
  created_by_name?: string | null;
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
  status_color?: string | null;
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
