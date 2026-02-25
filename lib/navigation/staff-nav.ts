import type { LucideIcon } from "lucide-react";
import { Users, Building2, Briefcase } from "lucide-react";

export interface StaffNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export function getStaffNavItems(orgId: string): StaffNavItem[] {
  const base = `/${orgId}/staff`;
  return [
    { label: "Employees", href: base, icon: Users },
    { label: "Departments", href: `${base}/departments`, icon: Building2 },
    { label: "Designations", href: `${base}/designations`, icon: Briefcase },
  ];
}
