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
  const leadsPrefix = `${basePath}/leads`;
  if (pathname === leadsPrefix || pathname.startsWith(leadsPrefix + "/")) {
    return getLeadsModuleNav(basePath);
  }
  const tasksPrefix = `${basePath}/tasks`;
  if (pathname === tasksPrefix || pathname.startsWith(tasksPrefix + "/")) {
    return getTasksModuleNav(basePath);
  }
  return getModuleNavConfig(industry, basePath);
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
