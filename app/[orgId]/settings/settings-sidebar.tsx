"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  getSettingsNavSections,
  type SettingsNavSection,
} from "./settings-nav";

interface SettingsSidebarProps {
  orgId: string;
}

export function SettingsSidebar({ orgId }: SettingsSidebarProps) {
  const pathname = usePathname();
  const sections = getSettingsNavSections(orgId);

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-muted/30 px-3 py-4">
      <nav className="flex flex-col gap-6">
        {sections.map((section) => (
          <SettingsSection key={section.title} section={section} pathname={pathname} />
        ))}
      </nav>
    </aside>
  );
}

function SettingsSection({
  section,
  pathname,
}: {
  section: SettingsNavSection;
  pathname: string;
}) {
  return (
    <div className="space-y-1">
      <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {section.title}
      </h3>
      <ul className="space-y-0.5">
        {section.items.map((item) => {
          const isActive = pathname === item.href;
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
    </div>
  );
}
