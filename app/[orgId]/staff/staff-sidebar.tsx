"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getStaffNavItems } from "@/lib/navigation/staff-nav";

interface StaffSidebarProps {
  orgId: string;
}

export function StaffSidebar({ orgId }: StaffSidebarProps) {
  const pathname = usePathname();
  const items = getStaffNavItems(orgId);

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-muted/30 px-3 py-4">
      <nav className="space-y-1">
        <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Staff
        </h3>
        <ul className="space-y-0.5">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== `/${orgId}/staff` && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
