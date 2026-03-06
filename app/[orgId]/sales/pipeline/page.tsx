"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useDeals, useUpdateDealById, usePipelineStages } from "@/hooks/use-sales";
import type { Deal } from "@/lib/supabase/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Plus, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/hooks/use-tenant";

function formatCurrency(value: number, currencySymbol: string): string {
  return `${currencySymbol}${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function SalesPipelinePage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const { tenant } = useTenant();
  const symbol = tenant?.currency_symbol ?? "$";

  const { data: stages } = usePipelineStages(orgId);
  const { data, isLoading } = useDeals(orgId, {
    page: 1,
    pageSize: 500,
  });
  const updateDeal = useUpdateDealById(orgId);

  const byStage = useMemo(() => {
    const items = data?.items ?? [];
    const map = new Map<string, Deal[]>();
    for (const stage of stages ?? []) {
      map.set(stage.id, []);
    }
    for (const deal of items) {
      const list = map.get(deal.stage_id);
      if (list) list.push(deal);
      else map.set(deal.stage_id, [deal]);
    }
    return map;
  }, [data?.items, stages]);

  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    e.dataTransfer.setData("dealId", deal.id);
    e.dataTransfer.setData("fromStageId", deal.stage_id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");
    if (!dealId || updateDeal.isPending) return;
    updateDeal.mutate({ dealId, data: { stage_id: stageId } });
  };

  if (!orgId) return null;

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col p-4">
        <h1 className="mb-4 shrink-0 text-lg font-semibold">Pipeline</h1>
        <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-4">
          {(stages ?? [{}]).map((_, i) => (
            <div
              key={i}
              className="h-full w-64 shrink-0 rounded-md border border-dashed bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const totalDeals = data?.items?.length ?? 0;
  if (totalDeals === 0) {
    const emptyAction = (
      <Button size="sm" asChild>
        <Link href={`/${orgId}/sales/deals/new`}>
          <Plus className="size-3.5" />
          New deal
        </Link>
      </Button>
    );
    return (
      <div className="flex h-full min-h-0 flex-col p-4">
        <h1 className="mb-2 shrink-0 text-lg font-semibold">Pipeline</h1>
        <p className="mb-4 shrink-0 text-sm text-muted-foreground">
          Create deals to see them in the pipeline.
        </p>
        <div className="flex min-h-0 flex-1 items-center">
          <EmptyState
            title="No deals"
            description="Add deals to see them in the pipeline."
            icon={LayoutGrid}
            action={emptyAction}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col p-4">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Drag cards between columns to change stage.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href={`/${orgId}/sales/deals/new`}>
            <Plus className="size-3.5" />
            New deal
          </Link>
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-4">
        {(stages ?? []).map((stage) => (
          <div
            key={stage.id}
            className={cn(
              "flex h-full min-h-0 w-64 shrink-0 flex-col rounded-md border bg-muted/20"
            )}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className="shrink-0 border-b px-3 py-2">
              <h2 className="font-medium text-sm">{stage.name}</h2>
              <p className="text-muted-foreground text-xs">
                {(byStage.get(stage.id) ?? []).length} deals
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2 space-y-2">
              {(byStage.get(stage.id) ?? []).map((deal) => (
                <Card
                  key={deal.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, deal)}
                  className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
                >
                  <Link
                    href={`/${orgId}/sales/deals/${deal.id}`}
                    className="block p-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CardHeader className="p-0">
                      <p className="font-medium text-sm truncate">{deal.name}</p>
                    </CardHeader>
                    <CardContent className="p-0 mt-0.5 space-y-0.5">
                      <p className="text-muted-foreground text-xs font-medium">
                        {formatCurrency(deal.value, symbol)}
                      </p>
                      {deal.expected_close_date && (
                        <p className="text-muted-foreground text-[10px]">
                          Close: {deal.expected_close_date}
                        </p>
                      )}
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
