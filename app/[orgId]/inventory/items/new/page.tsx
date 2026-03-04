"use client";

import { useParams } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InventoryItemForm } from "./inventory-item-form";

export default function NewInventoryItemPage() {
  const params = useParams();
  const orgId = params?.orgId as string;

  if (!orgId) return null;

  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-auto">
      <ScrollArea className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-2 py-4">
          <InventoryItemForm orgId={orgId} />
        </div>
      </ScrollArea>
    </div>
  );
}
