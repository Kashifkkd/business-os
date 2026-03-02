"use client";

import { useParams, useRouter } from "next/navigation";
import { useMarketingJourney } from "@/hooks/use-marketing";
import { JourneyForm } from "../journey-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditJourneyPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;

  const { data: journey, isLoading, isError } = useMarketingJourney(orgId, id);

  if (!orgId || !id) return null;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !journey) {
    router.replace(`/${orgId}/marketing/journeys`);
    return null;
  }

  return (
    <div className="h-full w-full min-h-0 flex flex-col">
      <JourneyForm orgId={orgId} initialJourney={journey} key={journey.id} />
    </div>
  );
}
