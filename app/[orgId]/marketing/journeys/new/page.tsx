"use client";

import { useParams } from "next/navigation";
import { JourneyForm } from "../journey-form";

export default function NewJourneyPage() {
  const params = useParams();
  const orgId = params?.orgId as string;

  if (!orgId) return null;

  return (
    <div className="h-full w-full min-h-0 flex flex-col">
      <JourneyForm orgId={orgId} initialJourney={null} />
    </div>
  );
}
