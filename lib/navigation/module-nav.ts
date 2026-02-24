import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  Shapes,
  ListTree,
  Tag,
  BarChart3,
  Home,
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
