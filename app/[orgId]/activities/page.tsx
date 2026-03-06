import { redirect } from "next/navigation";

type ActivitiesPageProps = {
  params: Promise<{ orgId: string }>;
};

export default async function ActivitiesPage({ params }: ActivitiesPageProps) {
  const { orgId } = await params;
  redirect(`/${orgId}/activities/calls`);
}
