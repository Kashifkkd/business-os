"use client";

import { useParams, useRouter } from "next/navigation";
import { useInventoryItem } from "@/hooks/use-inventory-items";
import { InventoryItemForm } from "../new/inventory-item-form";
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
      <div className="container mx-auto max-w-2xl p-4">
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !item) {
    router.replace(`/${orgId}/inventory/items`);
    return null;
  }

  return (
    <div className="h-full w-full min-h-0 flex flex-col">
      <div className="container mx-auto max-w-2xl flex-1 overflow-y-auto p-4">
        <InventoryItemForm key={item.id} orgId={orgId} initialItem={item} />
      </div>
    </div>
  );
}
