"use client";

import { useParams, useRouter } from "next/navigation";
import { useMarketingCampaign } from "@/hooks/use-marketing";
import { CampaignForm } from "../campaign-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;

  const { data: campaign, isLoading, isError } = useMarketingCampaign(orgId, id);

  if (!orgId || !id) return null;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !campaign) {
    router.replace(`/${orgId}/marketing/campaigns`);
    return null;
  }

  return (
    <div className="h-full w-full min-h-0 flex flex-col">
      <CampaignForm orgId={orgId} initialCampaign={campaign} key={campaign.id} />
    </div>
  );
}
