import { redirect } from "next/navigation";

export default async function SettingsIndexPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  redirect(`/${orgId}/settings/general`);
}
