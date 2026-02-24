import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/supabase/queries";
import { ListingsPageClient } from "./listings-page-client";

export default async function ListingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const tenant = await getTenantById(orgId);
  if (!tenant || tenant.industry !== "real_estate") notFound();

  return <ListingsPageClient />;
}
