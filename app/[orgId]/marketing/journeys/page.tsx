"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMarketingJourneys } from "@/hooks/use-marketing";
import { JourneysTable } from "./journeys-table";
import { SearchBox } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function MarketingJourneysPage() {
  const params = useParams();
  const orgId = params?.orgId as string;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data, isLoading, isRefetching } = useMarketingJourneys(orgId, {
    enabled: !!orgId && mounted,
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
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Journeys</h1>
          <p className="text-muted-foreground text-sm">
            Trigger-based automations: nurture sequences and follow-ups.
          </p>
        </div>
        <Button asChild>
          <Link href={`/${orgId}/marketing/journeys/new`}>
            <Plus className="size-3.5" />
            New journey
          </Link>
        </Button>
      </div>

      <JourneysTable
        orgId={orgId}
        data={tableData}
        isLoading={isLoading || isRefetching}
      />
    </div>
  );
}
