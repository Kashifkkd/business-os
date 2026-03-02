"use client";

/**
 * Finance content only. Secondary sidebar is rendered by ModuleLayout in AppShell.
 */
export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</div>;
}
