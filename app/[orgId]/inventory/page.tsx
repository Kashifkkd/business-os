import { redirect } from "next/navigation";

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  redirect(`/${orgId}/inventory/dashboard`);
}
