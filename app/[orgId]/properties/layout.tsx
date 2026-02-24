"use client";

/**
 * Properties content only. Secondary sidebar for real estate is rendered by ModuleLayout in AppShell.
 */
export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</div>
  );
}
