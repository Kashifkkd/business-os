-- Inventory module: items, groups, variants, warehouses, stock levels, movements,
-- vendors, purchase orders, sales orders, bills, picklists, packages, composite items.

-- ============================
-- Core inventory tables
-- ============================

CREATE TABLE public.inventory_item_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE INDEX idx_inventory_item_groups_tenant_id
  ON public.inventory_item_groups(tenant_id);

CREATE TRIGGER inventory_item_groups_updated_at
  BEFORE UPDATE ON public.inventory_item_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.inventory_item_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage inventory_item_groups"
  ON public.inventory_item_groups FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.inventory_item_groups IS 'Inventory item groups (categories) per tenant';

-- Items (products) ------------------------------------------------------

CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.inventory_item_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  unit TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  reorder_level INTEGER,
  cost NUMERIC(12, 2),
  selling_price NUMERIC(12, 2),
  tax_rate NUMERIC(5, 2),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_items_tenant_id
  ON public.inventory_items(tenant_id);

CREATE UNIQUE INDEX idx_inventory_items_tenant_sku
  ON public.inventory_items(tenant_id, sku)
  WHERE sku IS NOT NULL AND sku <> '';

CREATE TRIGGER inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage inventory_items"
  ON public.inventory_items FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.inventory_items IS 'Inventory items/products per tenant';

-- Item variants (e.g. size, color) -------------------------------------

CREATE TABLE public.inventory_item_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  attributes JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  cost NUMERIC(12, 2),
  selling_price NUMERIC(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_item_variants_tenant_id
  ON public.inventory_item_variants(tenant_id);

CREATE INDEX idx_inventory_item_variants_item_id
  ON public.inventory_item_variants(item_id);

CREATE UNIQUE INDEX idx_inventory_item_variants_tenant_sku
  ON public.inventory_item_variants(tenant_id, sku)
  WHERE sku IS NOT NULL AND sku <> '';

CREATE TRIGGER inventory_item_variants_updated_at
  BEFORE UPDATE ON public.inventory_item_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.inventory_item_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage inventory_item_variants"
  ON public.inventory_item_variants FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.inventory_item_variants IS 'Variants of inventory items (e.g. size, color)';

-- Warehouses / locations -----------------------------------------------

CREATE TABLE public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state_or_province TEXT,
  postal_code TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE INDEX idx_warehouses_tenant_id
  ON public.warehouses(tenant_id);

CREATE INDEX idx_warehouses_tenant_default
  ON public.warehouses(tenant_id, is_default);

CREATE TRIGGER warehouses_updated_at
  BEFORE UPDATE ON public.warehouses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage warehouses"
  ON public.warehouses FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.warehouses IS 'Warehouses / stock locations per tenant';

-- Stock levels (current quantity per item/variant and warehouse) -------

CREATE TABLE public.inventory_stock_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.inventory_item_variants(id) ON DELETE SET NULL,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity NUMERIC(14, 3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (item_id, variant_id, warehouse_id)
);

CREATE INDEX idx_inventory_stock_levels_tenant_item
  ON public.inventory_stock_levels(tenant_id, item_id);

CREATE INDEX idx_inventory_stock_levels_tenant_warehouse
  ON public.inventory_stock_levels(tenant_id, warehouse_id);

CREATE TRIGGER inventory_stock_levels_updated_at
  BEFORE UPDATE ON public.inventory_stock_levels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.inventory_stock_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage inventory_stock_levels"
  ON public.inventory_stock_levels FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.inventory_stock_levels IS 'Current stock per item/variant and warehouse';

-- Stock movements (audit log) -----------------------------------------

CREATE TABLE public.inventory_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.inventory_item_variants(id) ON DELETE SET NULL,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity NUMERIC(14, 3) NOT NULL,
  movement_type TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE INDEX idx_inventory_stock_movements_tenant_item
  ON public.inventory_stock_movements(tenant_id, item_id, created_at DESC);

CREATE INDEX idx_inventory_stock_movements_tenant_warehouse
  ON public.inventory_stock_movements(tenant_id, warehouse_id, created_at DESC);

ALTER TABLE public.inventory_stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage inventory_stock_movements"
  ON public.inventory_stock_movements FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.inventory_stock_movements IS 'Stock movement history (adjustments, transfers, purchases, sales)';

-- ============================
-- Purchase flow
-- ============================

CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state_or_province TEXT,
  postal_code TEXT,
  country TEXT,
  payment_terms TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendors_tenant_id
  ON public.vendors(tenant_id);

CREATE TRIGGER vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage vendors"
  ON public.vendors FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.vendors IS 'Vendors / suppliers per tenant';

CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  order_number TEXT,
  order_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  expected_date DATE,
  currency TEXT,
  total_amount NUMERIC(14, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_orders_tenant_id
  ON public.purchase_orders(tenant_id);

CREATE INDEX idx_purchase_orders_tenant_status
  ON public.purchase_orders(tenant_id, status);

CREATE TRIGGER purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage purchase_orders"
  ON public.purchase_orders FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.purchase_orders IS 'Purchase orders to vendors per tenant';

CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES public.inventory_item_variants(id) ON DELETE SET NULL,
  quantity NUMERIC(14, 3) NOT NULL,
  unit_cost NUMERIC(14, 2) NOT NULL,
  received_quantity NUMERIC(14, 3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_order_items_tenant_po
  ON public.purchase_order_items(tenant_id, purchase_order_id);

CREATE TRIGGER purchase_order_items_updated_at
  BEFORE UPDATE ON public.purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage purchase_order_items"
  ON public.purchase_order_items FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.purchase_order_items IS 'Line items for purchase orders';

CREATE TABLE public.vendor_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  bill_number TEXT,
  bill_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  due_date DATE,
  currency TEXT,
  amount NUMERIC(14, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_bills_tenant_id
  ON public.vendor_bills(tenant_id);

CREATE INDEX idx_vendor_bills_tenant_status
  ON public.vendor_bills(tenant_id, status);

CREATE TRIGGER vendor_bills_updated_at
  BEFORE UPDATE ON public.vendor_bills
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.vendor_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage vendor_bills"
  ON public.vendor_bills FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.vendor_bills IS 'Bills from vendors, optionally linked to purchase orders';

-- ============================
-- Sales flow
-- ============================

CREATE TABLE public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id UUID,
  status TEXT NOT NULL DEFAULT 'draft',
  order_number TEXT,
  order_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  expected_ship_date DATE,
  currency TEXT,
  total_amount NUMERIC(14, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_orders_tenant_id
  ON public.sales_orders(tenant_id);

CREATE INDEX idx_sales_orders_tenant_status
  ON public.sales_orders(tenant_id, status);

CREATE TRIGGER sales_orders_updated_at
  BEFORE UPDATE ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage sales_orders"
  ON public.sales_orders FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.sales_orders IS 'Sales orders per tenant';

CREATE TABLE public.sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sales_order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES public.inventory_item_variants(id) ON DELETE SET NULL,
  quantity NUMERIC(14, 3) NOT NULL,
  unit_price NUMERIC(14, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_order_items_tenant_so
  ON public.sales_order_items(tenant_id, sales_order_id);

CREATE TRIGGER sales_order_items_updated_at
  BEFORE UPDATE ON public.sales_order_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage sales_order_items"
  ON public.sales_order_items FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.sales_order_items IS 'Line items for sales orders';

CREATE TABLE public.picklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sales_order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_picklists_tenant_id
  ON public.picklists(tenant_id);

CREATE TRIGGER picklists_updated_at
  BEFORE UPDATE ON public.picklists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.picklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage picklists"
  ON public.picklists FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.picklists IS 'Picklists for preparing orders from warehouses';

CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  picklist_id UUID NOT NULL REFERENCES public.picklists(id) ON DELETE CASCADE,
  carrier TEXT,
  tracking_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_packages_tenant_id
  ON public.packages(tenant_id);

CREATE TRIGGER packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage packages"
  ON public.packages FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.packages IS 'Packages / shipments created from picklists';

-- ============================
-- Composite items (kits/bundles)
-- ============================

CREATE TABLE public.composite_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_composite_items_tenant_id
  ON public.composite_items(tenant_id);

CREATE TRIGGER composite_items_updated_at
  BEFORE UPDATE ON public.composite_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.composite_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage composite_items"
  ON public.composite_items FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.composite_items IS 'Composite items (kits/bundles) referencing a parent inventory item';

CREATE TABLE public.composite_item_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  composite_id UUID NOT NULL REFERENCES public.composite_items(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES public.inventory_item_variants(id) ON DELETE SET NULL,
  quantity NUMERIC(14, 3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_composite_item_components_tenant_composite
  ON public.composite_item_components(tenant_id, composite_id);

CREATE TRIGGER composite_item_components_updated_at
  BEFORE UPDATE ON public.composite_item_components
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.composite_item_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can manage composite_item_components"
  ON public.composite_item_components FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

COMMENT ON TABLE public.composite_item_components IS 'Components (inventory items) that make up a composite item';

