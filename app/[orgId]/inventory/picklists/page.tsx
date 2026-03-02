"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListFilter } from "lucide-react";

export default function PicklistsPage() {
  const params = useParams();
  const orgId = params?.orgId as string;

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4">
        <h1 className="text-md font-semibold">Picklists</h1>
        <p className="text-muted-foreground text-xs">
          Warehouse picking documents for sales orders.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListFilter className="size-4" />
            Picklists
          </CardTitle>
          <CardDescription>
            Picklist creation from sales orders will be available in a future release.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Picklists help warehouse staff prepare orders for shipment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
