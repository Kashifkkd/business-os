import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/supabase/queries";
import { StaffSidebar } from "./staff-sidebar";

export default async function StaffLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  if (!orgId) notFound();

  const tenant = await getTenantById(orgId);
  if (!tenant) notFound();

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <StaffSidebar orgId={orgId} />
      <div className="min-w-0 flex-1 overflow-auto p-4 md:p-6">{children}</div>
    </div>
  );
}
