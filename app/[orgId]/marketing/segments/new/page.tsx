"use client";

import { useParams } from "next/navigation";
import { SegmentForm } from "../segment-form";

export default function NewSegmentPage() {
  const params = useParams();
  const orgId = params?.orgId as string;

  if (!orgId) return null;

  return (
    <div className="h-full w-full min-h-0 flex flex-col">
      <SegmentForm orgId={orgId} initialSegment={null} />
    </div>
  );
}
