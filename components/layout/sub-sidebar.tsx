"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SubNavItem } from "@/lib/navigation/module-nav";

export interface SubSidebarProps {
  /** Section heading (e.g. "CAFE MANAGEMENT") */
  title: string;
  /** Nav items for this module */
  items: SubNavItem[];
  /** Optional class for the wrapper */
  className?: string;
}

/**
 * Dynamic sub-sidebar for a module (e.g. Cafe Management).
 * Reuse for any module that needs a nested nav: pass title + items.
 */
export function SubSidebar({ title, items, className }: SubSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 w-52 flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      <div className="flex flex-1 flex-col overflow-hidden p-3">
        <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {items.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant="ghost"
                className={cn(
                  "relative w-full justify-start gap-2 h-9 cursor-pointer shadow-none transition-colors",
                  isActive(href)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "bg-transparent text-muted-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate text-sm">{label}</span>
                {isActive(href) && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r bg-sidebar-primary" />
                )}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
