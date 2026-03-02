"use client";

import { useParams } from "next/navigation";
import { InventoryItemForm } from "./inventory-item-form";

export default function NewInventoryItemPage() {
  const params = useParams();
  const orgId = params?.orgId as string;

  if (!orgId) return null;

  return (
    <div className="h-full w-full min-h-0 flex flex-col">
      <div className="container mx-auto max-w-2xl flex-1 overflow-y-auto p-4">
        <InventoryItemForm orgId={orgId} />
      </div>
    </div>
  );
}
