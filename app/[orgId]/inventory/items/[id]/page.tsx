"use client";

import { useParams, useRouter } from "next/navigation";
import { useInventoryItem } from "@/hooks/use-inventory-items";
import { InventoryItemForm } from "../new/inventory-item-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditInventoryItemPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;

  const { data: item, isLoading, isError } = useInventoryItem(orgId, id);

  if (!orgId || !id) return null;

  if (isLoading) {
    return (
      <div className="flex h-full w-full min-h-0 flex-col overflow-auto">
        <div className="mx-auto w-full max-w-6xl px-2 py-4">
          <Skeleton className="mb-4 h-8 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !item) {
    router.replace(`/${orgId}/inventory/items`);
    return null;
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-auto">
      <ScrollArea className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-2 py-4">
          <InventoryItemForm key={item.id} orgId={orgId} initialItem={item} />
        </div>
      </ScrollArea>
    </div>
  );
}
