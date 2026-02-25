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
    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</div>
  );
}
