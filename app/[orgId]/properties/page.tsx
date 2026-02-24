import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/supabase/queries";
import { PropertiesPageClient } from "./properties-page-client";

export default async function PropertiesPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const tenant = await getTenantById(orgId);
  if (!tenant || tenant.industry !== "real_estate") notFound();

  return <PropertiesPageClient />;
}
