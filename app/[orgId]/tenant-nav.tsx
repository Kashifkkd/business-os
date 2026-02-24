"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Settings, Utensils, ShoppingBag, Home, List } from "lucide-react";

export function TenantNav() {
  const { tenant } = useTenant();
  const pathname = usePathname();

  if (!tenant) return null;

  const base = `/${tenant.id}`;
  const homeHref = `/${tenant.id}/home`;
  const navItems =
    tenant.industry === "cafe"
      ? [
          { href: homeHref, label: "Overview", icon: LayoutDashboard },
          { href: `${base}/menu`, label: "Menu", icon: Utensils },
          { href: `${base}/orders`, label: "Orders", icon: ShoppingBag },
          { href: `${base}/settings`, label: "Settings", icon: Settings },
        ]
      : [
          { href: homeHref, label: "Overview", icon: LayoutDashboard },
          { href: `${base}/properties`, label: "Properties", icon: Home },
          { href: `${base}/listings`, label: "Listings", icon: List },
          { href: `${base}/settings`, label: "Settings", icon: Settings },
        ];

  return (
    <nav className="flex gap-1 border-b pb-2">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === href || (href !== base && pathname.startsWith(href))
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
