export type DemoInventoryGroupSeed = {
  name: string;
  description: string | null;
  sort_order: number;
};

export type DemoInventoryItemSeed = {
  groupIndex: number;
  name: string;
  sku: string | null;
  description: string | null;
  unit: string | null;
  cost: number | null;
  selling_price: number | null;
  reorder_level: number | null;
};

export type DemoWarehouseSeed = {
  name: string;
  code: string | null;
  is_default: boolean;
};

export type DemoVendorSeed = {
  name: string;
  email: string | null;
  phone: string | null;
  payment_terms: string | null;
};

export type DemoStockLevelSeed = {
  itemIndex: number;
  warehouseIndex: number;
  quantity: number;
};

export const DEMO_INVENTORY_GROUPS: DemoInventoryGroupSeed[] = [
  { name: "Beverages", description: "Drinks and coffee", sort_order: 0 },
  { name: "Food", description: "Food items", sort_order: 1 },
  { name: "Supplies", description: "Operational supplies", sort_order: 2 },
  { name: "Packaging", description: "Containers and packaging", sort_order: 3 },
];

export const DEMO_INVENTORY_ITEMS: DemoInventoryItemSeed[] = [
  { groupIndex: 0, name: "Espresso beans (1kg)", sku: "BEV-001", description: "Premium espresso blend", unit: "bag", cost: 12.5, selling_price: 24, reorder_level: 10 },
  { groupIndex: 0, name: "Oat milk (1L)", sku: "BEV-002", description: "Barista oat milk", unit: "carton", cost: 2.8, selling_price: 0, reorder_level: 24 },
  { groupIndex: 0, name: "Syrup bottle (750ml)", sku: "BEV-003", description: "Vanilla syrup", unit: "bottle", cost: 6, selling_price: 0, reorder_level: 12 },
  { groupIndex: 0, name: "Cold brew concentrate", sku: "BEV-004", description: "1L concentrate", unit: "bottle", cost: 8, selling_price: 0, reorder_level: 8 },
  { groupIndex: 1, name: "Croissant", sku: "FOD-001", description: "Butter croissant", unit: "each", cost: 1.2, selling_price: 3.5, reorder_level: 20 },
  { groupIndex: 1, name: "Sandwich roll", sku: "FOD-002", description: "Fresh sandwich roll", unit: "each", cost: 0.8, selling_price: 0, reorder_level: 30 },
  { groupIndex: 1, name: "Salad mix (500g)", sku: "FOD-003", description: "Pre-washed salad", unit: "bag", cost: 3.5, selling_price: 0, reorder_level: 15 },
  { groupIndex: 2, name: "Napkins (500 pk)", sku: "SUP-001", description: "Paper napkins", unit: "case", cost: 18, selling_price: 0, reorder_level: 5 },
  { groupIndex: 2, name: "Cleaning spray", sku: "SUP-002", description: "Multi-surface cleaner", unit: "bottle", cost: 4, selling_price: 0, reorder_level: 10 },
  { groupIndex: 2, name: "Straws (1000 pk)", sku: "SUP-003", description: "Paper straws", unit: "box", cost: 12, selling_price: 0, reorder_level: 8 },
  { groupIndex: 3, name: "Takeaway cup (12oz)", sku: "PKG-001", description: "Hot cup with sleeve", unit: "case", cost: 25, selling_price: 0, reorder_level: 20 },
  { groupIndex: 3, name: "Lid (12oz)", sku: "PKG-002", description: "Matching lids", unit: "case", cost: 15, selling_price: 0, reorder_level: 20 },
  { groupIndex: 3, name: "Paper bag (small)", sku: "PKG-003", description: "Takeaway bag", unit: "case", cost: 8, selling_price: 0, reorder_level: 15 },
];

export const DEMO_WAREHOUSES: DemoWarehouseSeed[] = [
  { name: "Main", code: "WH-MAIN", is_default: true },
  { name: "Secondary", code: "WH-SEC", is_default: false },
];

export const DEMO_VENDORS: DemoVendorSeed[] = [
  { name: "Beverage Supply Co", email: "orders@beveragesupply.example.com", phone: "+1 555-1000", payment_terms: "Net 30" },
  { name: "Fresh Foods Ltd", email: "orders@freshfoods.example.com", phone: "+1 555-1001", payment_terms: "Net 15" },
  { name: "Packaging Direct", email: "sales@packagingdirect.example.com", phone: null, payment_terms: "Net 30" },
];

export const DEMO_STOCK_LEVELS: DemoStockLevelSeed[] = [
  { itemIndex: 0, warehouseIndex: 0, quantity: 25 },
  { itemIndex: 0, warehouseIndex: 1, quantity: 10 },
  { itemIndex: 1, warehouseIndex: 0, quantity: 48 },
  { itemIndex: 2, warehouseIndex: 0, quantity: 24 },
  { itemIndex: 4, warehouseIndex: 0, quantity: 40 },
  { itemIndex: 7, warehouseIndex: 0, quantity: 12 },
  { itemIndex: 10, warehouseIndex: 0, quantity: 30 },
  { itemIndex: 10, warehouseIndex: 1, quantity: 15 },
];

// ——— Purchase orders (vendorIndex, warehouseIndex, lines by itemIndex) ———
export type DemoPurchaseOrderLineSeed = {
  itemIndex: number;
  quantity: number;
  unit_cost: number;
};

export type DemoPurchaseOrderSeed = {
  vendorIndex: number;
  warehouseIndex: number;
  status: string;
  order_number: string;
  order_date: string;
  expected_date: string | null;
  currency: string | null;
  lines: DemoPurchaseOrderLineSeed[];
};

export const DEMO_PURCHASE_ORDERS: DemoPurchaseOrderSeed[] = [
  {
    vendorIndex: 0,
    warehouseIndex: 0,
    status: "received",
    order_number: "PO-001",
    order_date: "2025-02-01",
    expected_date: "2025-02-08",
    currency: "USD",
    lines: [
      { itemIndex: 0, quantity: 20, unit_cost: 12.5 },
      { itemIndex: 1, quantity: 24, unit_cost: 2.8 },
    ],
  },
  {
    vendorIndex: 1,
    warehouseIndex: 0,
    status: "sent",
    order_number: "PO-002",
    order_date: "2025-02-15",
    expected_date: "2025-02-22",
    currency: "USD",
    lines: [
      { itemIndex: 4, quantity: 30, unit_cost: 1.2 },
      { itemIndex: 5, quantity: 50, unit_cost: 0.8 },
    ],
  },
];

// ——— Vendor bills (vendorIndex, optional purchaseOrderIndex) ———
export type DemoVendorBillSeed = {
  vendorIndex: number;
  purchaseOrderIndex: number | null;
  bill_number: string;
  bill_date: string;
  due_date: string | null;
  amount: number;
  status: string;
};

export const DEMO_VENDOR_BILLS: DemoVendorBillSeed[] = [
  { vendorIndex: 0, purchaseOrderIndex: 0, bill_number: "INV-001", bill_date: "2025-02-10", due_date: "2025-03-12", amount: 339.2, status: "paid" },
  { vendorIndex: 1, purchaseOrderIndex: 1, bill_number: "INV-002", bill_date: "2025-02-20", due_date: "2025-03-07", amount: 76, status: "open" },
];

// ——— Sales orders (lines by itemIndex) ———
export type DemoSalesOrderLineSeed = {
  itemIndex: number;
  quantity: number;
  unit_price: number;
};

export type DemoSalesOrderSeed = {
  status: string;
  order_number: string;
  order_date: string;
  expected_ship_date: string | null;
  currency: string | null;
  lines: DemoSalesOrderLineSeed[];
};

export const DEMO_SALES_ORDERS: DemoSalesOrderSeed[] = [
  {
    status: "confirmed",
    order_number: "SO-001",
    order_date: "2025-02-10",
    expected_ship_date: "2025-02-12",
    currency: "USD",
    lines: [
      { itemIndex: 0, quantity: 5, unit_price: 24 },
      { itemIndex: 4, quantity: 10, unit_price: 3.5 },
    ],
  },
  {
    status: "draft",
    order_number: "SO-002",
    order_date: "2025-02-18",
    expected_ship_date: null,
    currency: "USD",
    lines: [
      { itemIndex: 10, quantity: 2, unit_price: 25 },
      { itemIndex: 11, quantity: 2, unit_price: 15 },
    ],
  },
];

// ——— Picklists (salesOrderIndex, warehouseIndex) ———
export type DemoPicklistSeed = {
  salesOrderIndex: number;
  warehouseIndex: number;
  status: string;
};

export const DEMO_PICKLISTS: DemoPicklistSeed[] = [
  { salesOrderIndex: 0, warehouseIndex: 0, status: "picked" },
];

// ——— Packages (picklistIndex) ———
export type DemoPackageSeed = {
  picklistIndex: number;
  carrier: string | null;
  tracking_number: string | null;
  status: string;
};

export const DEMO_PACKAGES: DemoPackageSeed[] = [
  { picklistIndex: 0, carrier: "UPS", tracking_number: "1Z999AA10123456784", status: "shipped" },
];

// ——— Composite items (parent inventory_item index, name, components by itemIndex + quantity) ———
export type DemoCompositeComponentSeed = {
  itemIndex: number;
  quantity: number;
};

export type DemoCompositeItemSeed = {
  inventoryItemIndex: number;
  name: string;
  description: string | null;
  components: DemoCompositeComponentSeed[];
};

export const DEMO_COMPOSITE_ITEMS: DemoCompositeItemSeed[] = [
  {
    inventoryItemIndex: 0,
    name: "Starter Coffee Kit",
    description: "Espresso beans + oat milk bundle",
    components: [
      { itemIndex: 0, quantity: 1 },
      { itemIndex: 1, quantity: 2 },
    ],
  },
  {
    inventoryItemIndex: 4,
    name: "Breakfast Combo",
    description: "Croissant + roll",
    components: [
      { itemIndex: 4, quantity: 1 },
      { itemIndex: 5, quantity: 1 },
    ],
  },
];
