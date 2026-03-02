"use client";

import { useParams, useRouter } from "next/navigation";
import { useMarketingSegment } from "@/hooks/use-marketing";
import { SegmentForm } from "../segment-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditSegmentPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;

  const { data: segment, isLoading, isError } = useMarketingSegment(orgId, id);

  if (!orgId || !id) return null;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !segment) {
    router.replace(`/${orgId}/marketing/segments`);
    return null;
  }

  return (
    <div className="h-full w-full min-h-0 flex flex-col">
      <SegmentForm orgId={orgId} initialSegment={segment} key={segment.id} />
    </div>
  );
}
