"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Settings,
  Utensils,
  ShoppingBag,
  Home,
  Users,
  LayoutGrid,
  DollarSign,
  Megaphone,
  UserCircle,
  UserPlus,
} from "lucide-react";

export function AppSidebar() {
  const { tenant } = useTenant();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  if (!tenant) return null;

  const base = `/${tenant.id}`;
  const homeHref = `/${tenant.id}/home`;

  const industryNavItems =
    tenant.industry === "cafe"
      ? [
        { href: homeHref, label: "Overview", icon: LayoutDashboard },
        { href: `${base}/leads`, label: "Leads", icon: UserPlus },
        { href: `${base}/menu/items`, label: "Menu Management", icon: Utensils },
        { href: `${base}/orders`, label: "Order History", icon: ShoppingBag },
        { href: `${base}/promotions`, label: "Promotions", icon: Megaphone },
        { href: `${base}/customers`, label: "Customers", icon: UserCircle },
      ]
      : [
        { href: homeHref, label: "Overview", icon: LayoutDashboard },
        { href: `${base}/leads`, label: "Leads", icon: UserPlus },
        { href: `${base}/properties`, label: "Properties", icon: Home },
      ];

  const managementItems = [
    { href: `${base}/staff`, label: "Staff Roster", icon: Users },
    { href: `${base}/table-layout`, label: "Table Layout", icon: LayoutGrid },
    { href: `${base}/financials`, label: "Financials", icon: DollarSign },
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== base && pathname.startsWith(href));
  const isMenuActive = pathname.startsWith(`${base}/menu`);
  const isSettingsActive = pathname.startsWith(`${base}/settings`);

  const navButtonClass = (active: boolean) =>
    cn(
      "relative w-full justify-start gap-2 h-10 cursor-pointer shadow-none transition-colors",
      active
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "bg-transparent hover:bg-sidebar-accent/50 text-muted-foreground hover:text-sidebar-accent-foreground"
    );

  return (
    <div
      className="flex h-full min-h-0 flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground relative z-30 w-14"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Expanded overlay - does not shift main content */}
      <div
        className={cn(
          "absolute left-0 top-0 h-full border-r border-sidebar-border bg-sidebar transition-[width,opacity] duration-200 ease-out z-40 flex flex-col",
          isHovered
            ? "w-64 opacity-100"
            : "w-12 opacity-0 pointer-events-none"
        )}
      >
        <div className="flex flex-1 flex-col overflow-hidden p-1">
          <nav className="flex-1 space-y-1 overflow-y-auto">

          {industryNavItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  className={navButtonClass(
                    href.includes("/menu") ? isMenuActive : isActive(href)
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate text-sm">{label}</span>
                </Button>
              </Link>
            ))}

            {managementItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button variant="ghost" className={navButtonClass(isActive(href))}>
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate text-sm">{label}</span>
                </Button>
              </Link>
            ))}
          </nav>

          <div className="border-t border-sidebar-border space-y-1 p-2">
            <Link href={`${base}/settings`}>
              <Button
                variant="ghost"
                className={navButtonClass(isSettingsActive)}
              >
                <Settings className="size-4 shrink-0" />
                <span className="truncate text-sm">Settings</span>
                {isSettingsActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r bg-sidebar-primary" />
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Collapsed icon-only rail (always visible) */}
      <nav className="flex flex-1 flex-col p-1">
        <div className="space-y-1">
          {industryNavItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} title={label}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "flex items-center justify-center relative h-10 w-12 shrink-0 cursor-pointer shadow-none transition-colors",
                  (href.includes("/menu") ? isMenuActive : isActive(href))
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "bg-transparent hover:bg-sidebar-accent/50 text-muted-foreground hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4" />
              </Button>
            </Link>
          ))}
        </div>
        <div className="mt-4 space-y-1">
          {managementItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} title={label}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "relative h-10 w-12 shrink-0 cursor-pointer shadow-none transition-colors",
                  isActive(href)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "bg-transparent hover:bg-sidebar-accent/50 text-muted-foreground hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4" />
                {isActive(href) && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r bg-sidebar-primary" />
                )}
              </Button>
            </Link>
          ))}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <Link href={`${base}/settings`} title="Settings">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative h-10 w-10 shrink-0 cursor-pointer shadow-none transition-colors",
              isSettingsActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "bg-transparent hover:bg-sidebar-accent/50 text-sidebar-foreground hover:text-sidebar-accent-foreground"
            )}
          >
            <Settings className="size-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
