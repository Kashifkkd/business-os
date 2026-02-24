import { notFound } from "next/navigation";
import { OrgLayoutClient } from "./org-layout-client";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  if (!orgId) notFound();

  return <OrgLayoutClient orgId={orgId}>{children}</OrgLayoutClient>;
}
