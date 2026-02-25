"use client";

/**
 * Tasks content only. Secondary sidebar for Tasks is rendered by ModuleLayout in AppShell.
 */
export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</div>
  );
}
