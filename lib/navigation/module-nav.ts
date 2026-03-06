import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  Shapes,
  ListTree,
  Tag,
  BarChart3,
  Home,
  ListFilter,
  LayoutGrid,
  UserPlus,
  ListTodo,
  Calendar,
  Table2,
  Megaphone,
  Workflow,
  FolderKanban,
  FileText,
  Package,
  Warehouse,
  Truck,
  Receipt,
  DollarSign,
  TrendingUp,
  Landmark,
  Wallet,
  ReceiptText,
  Phone,
  Video,
} from "lucide-react";

export interface SubNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface ModuleNavConfig {
  /** Section title shown in the sub-sidebar (e.g. "CAFE MANAGEMENT") */
  title: string;
  /** Path prefix that indicates user is inside this module (e.g. /orgId/home, /orgId/menu) */
  pathPrefixes: string[];
  items: SubNavItem[];
}

/**
 * Returns the module sub-nav config for the current industry.
 * Add more modules here as you add industries or sections (e.g. real_estate_management).
 */
export function getModuleNavConfig(
  industry: string,
  basePath: string
): ModuleNavConfig | null {
  if (industry === "cafe") {
    return getCafeModuleNav(basePath);
  }
  if (industry === "real_estate") {
    return getRealEstateModuleNav(basePath);
  }
  return null;
}

/** Leads module sub-nav (path-based: shown when user is under /leads). */
export function getLeadsModuleNav(basePath: string): ModuleNavConfig {
  const base = basePath;
  const leads = `${base}/leads`;
  return {
    title: "LEADS",
    pathPrefixes: [
      leads,
      `${leads}/new`,
      `${leads}/pipeline`,
      `${leads}/sources`,
      `${leads}/insights`,
      `${leads}/import`,
    ],
    items: [
      { href: leads, label: "All leads", icon: ListFilter },
      { href: `${leads}/pipeline`, label: "Pipeline", icon: LayoutGrid },
      { href: `${leads}/sources`, label: "Sources", icon: Tag },
      { href: `${leads}/insights`, label: "Insights", icon: BarChart3 },
    ],
  };
}

/** Activities module sub-nav (path-based: shown when user is under /activities). */
export function getActivitiesModuleNav(basePath: string): ModuleNavConfig {
  const base = basePath;
  const activities = `${base}/activities`;
  return {
    title: "ACTIVITIES",
    pathPrefixes: [
      activities,
      `${activities}/calls`,
      `${activities}/meetings`,
    ],
    items: [
      { href: `${activities}/calls`, label: "Calls", icon: Phone },
      { href: `${activities}/meetings`, label: "Meetings", icon: Video },
    ],
  };
}

/** Tasks module sub-nav (path-based: shown when user is under /tasks). */
export function getTasksModuleNav(basePath: string): ModuleNavConfig {
  const base = basePath;
  const tasks = `${base}/tasks`;
  return {
    title: "TASKS",
    pathPrefixes: [
      tasks,
      `${tasks}/new`,
      `${tasks}/list`,
      `${tasks}/board`,
      `${tasks}/calendar`,
      `${tasks}/table`,
    ],
    items: [
      { href: tasks, label: "All tasks", icon: ListTodo },
      { href: `${tasks}/list`, label: "List", icon: ListFilter },
      { href: `${tasks}/board`, label: "Board", icon: LayoutGrid },
      { href: `${tasks}/calendar`, label: "Calendar", icon: Calendar },
      { href: `${tasks}/table`, label: "Table", icon: Table2 },
    ],
  };
}

/**
 * Returns module nav with path precedence: when pathname is under /leads, use Leads module;
 * when under /tasks, use Tasks module; otherwise use industry-based config (Cafe / Real Estate).
 */
export function getModuleNavConfigForPath(
  industry: string,
  basePath: string,
  pathname: string
): ModuleNavConfig | null {
  const inventoryPrefix = `${basePath}/inventory`;
  if (pathname === inventoryPrefix || pathname.startsWith(inventoryPrefix + "/")) {
    return getInventoryModuleNav(basePath);
  }
  const salesPrefix = `${basePath}/sales`;
  if (pathname === salesPrefix || pathname.startsWith(salesPrefix + "/")) {
    return getSalesModuleNav(basePath);
  }
  const marketingPrefix = `${basePath}/marketing`;
  if (pathname === marketingPrefix || pathname.startsWith(marketingPrefix + "/")) {
    return getMarketingModuleNav(basePath);
  }
  const leadsPrefix = `${basePath}/leads`;
  if (pathname === leadsPrefix || pathname.startsWith(leadsPrefix + "/")) {
    return getLeadsModuleNav(basePath);
  }
  const activitiesPrefix = `${basePath}/activities`;
  if (pathname === activitiesPrefix || pathname.startsWith(activitiesPrefix + "/")) {
    return getActivitiesModuleNav(basePath);
  }
  const tasksPrefix = `${basePath}/tasks`;
  if (pathname === tasksPrefix || pathname.startsWith(tasksPrefix + "/")) {
    return getTasksModuleNav(basePath);
  }
  const financePrefix = `${basePath}/finance`;
  if (pathname === financePrefix || pathname.startsWith(financePrefix + "/")) {
    return getFinanceModuleNav(basePath);
  }
  return getModuleNavConfig(industry, basePath);
}

/** Inventory module sub-nav (path-based: shown when user is under /inventory). */
export function getInventoryModuleNav(basePath: string): ModuleNavConfig {
  const base = basePath;
  const inventory = `${base}/inventory`;
  return {
    title: "INVENTORY",
    pathPrefixes: [
      inventory,
      `${inventory}/dashboard`,
      `${inventory}/items`,
      `${inventory}/item-groups`,
      `${inventory}/warehouses`,
      `${inventory}/vendors`,
      `${inventory}/purchase-orders`,
      `${inventory}/sales-orders`,
      `${inventory}/bills`,
      `${inventory}/picklists`,
      `${inventory}/packages`,
      `${inventory}/composite-items`,
      `${inventory}/reports`,
    ],
    items: [
      { href: `${inventory}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
      { href: `${inventory}/items`, label: "Items", icon: BookOpen },
      { href: `${inventory}/item-groups`, label: "Item Groups", icon: Shapes },
      { href: `${inventory}/warehouses`, label: "Warehouses", icon: Warehouse },
      { href: `${inventory}/vendors`, label: "Vendors", icon: Truck },
      { href: `${inventory}/purchase-orders`, label: "Purchase Orders", icon: Receipt },
      { href: `${inventory}/sales-orders`, label: "Sales Orders", icon: Receipt },
      { href: `${inventory}/bills`, label: "Bills", icon: FileText },
      { href: `${inventory}/picklists`, label: "Picklists", icon: ListFilter },
      { href: `${inventory}/packages`, label: "Packages", icon: Package },
      { href: `${inventory}/composite-items`, label: "Composite Items", icon: ListTree },
      { href: `${inventory}/reports`, label: "Reports", icon: BarChart3 },
    ],
  };
}

/** Sales module sub-nav (path-based: shown when user is under /sales). */
export function getSalesModuleNav(basePath: string): ModuleNavConfig {
  const base = basePath;
  const sales = `${base}/sales`;
  return {
    title: "SALES",
    pathPrefixes: [
      sales,
      `${sales}/pipeline`,
      `${sales}/deals`,
      `${sales}/forecast`,
      `${sales}/analytics`,
    ],
    items: [
      { href: sales, label: "Overview", icon: LayoutDashboard },
      { href: `${sales}/pipeline`, label: "Pipeline", icon: LayoutGrid },
      { href: `${sales}/deals`, label: "Deals", icon: ListFilter },
      { href: `${sales}/forecast`, label: "Forecast", icon: TrendingUp },
      { href: `${sales}/analytics`, label: "Analytics", icon: BarChart3 },
    ],
  };
}

/** Finance module sub-nav (path-based: shown when user is under /finance). */
export function getFinanceModuleNav(basePath: string): ModuleNavConfig {
  const base = basePath;
  const finance = `${base}/finance`;
  return {
    title: "FINANCE",
    pathPrefixes: [
      finance,
      `${finance}/dashboard`,
      `${finance}/chart-of-accounts`,
      `${finance}/invoices`,
      `${finance}/bills`,
      `${finance}/expenses`,
      `${finance}/banking`,
      `${finance}/reports`,
    ],
    items: [
      { href: `${finance}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
      { href: `${finance}/chart-of-accounts`, label: "Chart of Accounts", icon: BookOpen },
      { href: `${finance}/invoices`, label: "Invoices", icon: ReceiptText },
      { href: `${finance}/bills`, label: "Bills", icon: FileText },
      { href: `${finance}/expenses`, label: "Expenses", icon: Wallet },
      { href: `${finance}/banking`, label: "Banking", icon: Landmark },
      { href: `${finance}/reports`, label: "Reports", icon: BarChart3 },
    ],
  };
}

/** Marketing module sub-nav (path-based: shown when user is under /marketing). */
export function getMarketingModuleNav(basePath: string): ModuleNavConfig {
  const base = basePath;
  const marketing = `${base}/marketing`;
  return {
    title: "MARKETING",
    pathPrefixes: [
      marketing,
      `${marketing}/campaigns`,
      `${marketing}/journeys`,
      `${marketing}/segments`,
      `${marketing}/templates`,
      `${marketing}/analytics`,
    ],
    items: [
      { href: marketing, label: "Overview", icon: Megaphone },
      { href: `${marketing}/campaigns`, label: "Campaigns", icon: FolderKanban },
      { href: `${marketing}/journeys`, label: "Journeys", icon: Workflow },
      { href: `${marketing}/segments`, label: "Segments", icon: ListFilter },
      { href: `${marketing}/templates`, label: "Templates", icon: FileText },
      { href: `${marketing}/analytics`, label: "Analytics", icon: BarChart3 },
    ],
  };
}

export function getRealEstateModuleNav(basePath: string): ModuleNavConfig {
  const base = basePath;
  return {
    title: "REAL ESTATE",
    pathPrefixes: [
      `${base}/properties`,
      `${base}/properties/categories`,
      `${base}/properties/subcategories`,
    ],
    items: [
      { href: `${base}/properties`, label: "Properties", icon: Home },
      { href: `${base}/properties/categories`, label: "Categories", icon: Shapes },
      { href: `${base}/properties/subcategories`, label: "Sub-categories", icon: ListTree },
    ],
  };
}

export function getCafeModuleNav(basePath: string): ModuleNavConfig {
  const base = basePath;
  const menu = `${base}/menu`;
  return {
    title: "CAFE MANAGEMENT",
    pathPrefixes: [
      `${menu}/dashboard`,
      `${menu}/items`,
      `${menu}/categories`,
      `${menu}/subcategories`,
      `${menu}/discounts`,
      `${menu}/insights`,
    ],
    items: [
      { href: `${menu}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
      { href: `${menu}/items`, label: "Menu Items", icon: BookOpen },
      { href: `${menu}/categories`, label: "Categories", icon: Shapes },
      { href: `${menu}/subcategories`, label: "Sub-categories", icon: ListTree },
      { href: `${menu}/discounts`, label: "Discounts", icon: Tag },
      { href: `${menu}/insights`, label: "Cafe Insights", icon: BarChart3 },
    ],
  };
}
