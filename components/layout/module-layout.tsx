"use client";

import { usePathname } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { SubSidebar } from "@/components/layout/sub-sidebar";
import { getModuleNavConfig } from "@/lib/navigation/module-nav";

type ModuleLayoutProps = {
  children: React.ReactNode;
};

/**
 * Wraps children with the module sub-sidebar when inside a module (e.g. Cafe Management).
 * Use in the org layout so the sub-sidebar is part of the content tree, not AppShell.
 */
export function ModuleLayout({ children }: ModuleLayoutProps) {
  const { tenant } = useTenant();
  const pathname = usePathname();

  if (!tenant) return <>{children}</>;

  const base = `/${tenant.id}`;
  const moduleNav = getModuleNavConfig(tenant.industry, base);
  const isInModule =
    moduleNav &&
    moduleNav.pathPrefixes.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

  if (!isInModule || !moduleNav) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <SubSidebar title={moduleNav.title} items={moduleNav.items} />
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
