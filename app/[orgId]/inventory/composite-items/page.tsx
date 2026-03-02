"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTree } from "lucide-react";

export default function CompositeItemsPage() {
  const params = useParams();
  const orgId = params?.orgId as string;

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4">
        <h1 className="text-md font-semibold">Composite Items</h1>
        <p className="text-muted-foreground text-xs">
          Kits and bundles made from multiple inventory items.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTree className="size-4" />
            Composite Items
          </CardTitle>
          <CardDescription>
            Kit and bundle management will be available in a future release.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Create composite items that consist of multiple components with quantities.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
