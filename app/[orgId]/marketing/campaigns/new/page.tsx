"use client";

import { useParams } from "next/navigation";
import { CampaignForm } from "../campaign-form";

export default function NewCampaignPage() {
  const params = useParams();
  const orgId = params?.orgId as string;

  if (!orgId) return null;

  return (
    <div className="h-full w-full min-h-0 flex flex-col">
      <CampaignForm orgId={orgId} initialCampaign={null} />
    </div>
  );
}
