"use client";

/**
 * Logs content only. No sub-sidebar for Logs (single Activity log page).
 */
export default function LogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-1 overflow-auto">{children}</div>
  );
}
