"use client";

import { useParams } from "next/navigation";
import { useMarketingJourneys } from "@/hooks/use-marketing";
import { JourneysTable } from "./journeys-table";

export default function MarketingJourneysPage() {
  const params = useParams();
  const orgId = params?.orgId as string;


  const { data, isLoading, isRefetching } = useMarketingJourneys(orgId, {
    enabled: !!orgId ,
  });

  const tableData = data ?? {
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
  };

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Journeys</h1>
        <p className="text-muted-foreground text-sm">
          Trigger-based automations: nurture sequences and follow-ups.
        </p>
      </div>

      <JourneysTable
        orgId={orgId}
        data={tableData}
        isLoading={isLoading || isRefetching}
      />
    </div>
  );
}
