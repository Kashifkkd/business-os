"use client";

/**
 * Leads content only. Secondary sidebar for Leads is rendered by ModuleLayout in AppShell.
 */
export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-1 overflow-auto">{children}</div>
  );
}
