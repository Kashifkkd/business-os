"use client";

import { SubSidebar } from "@/components/layout/sub-sidebar";
import { getCafeModuleNav } from "@/lib/navigation/module-nav";

type CafeModuleLayoutProps = {
  orgId: string;
  children: React.ReactNode;
};

/**
 * Use directly in cafe pages: wraps content with the Cafe Management sub-sidebar.
 * Very easy - just wrap your page content with this and pass orgId.
 */
export function CafeModuleLayout({ orgId, children }: CafeModuleLayoutProps) {
  const config = getCafeModuleNav(`/${orgId}`);
  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
      <SubSidebar title={config.title} items={config.items} />
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
