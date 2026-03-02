import { redirect } from "next/navigation";

export default async function FinancePage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  redirect(`/${orgId}/finance/dashboard`);
}
