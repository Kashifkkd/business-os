"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";

export default function PurchaseOrdersPage() {
  const params = useParams();
  const orgId = params?.orgId as string;

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4">
        <h1 className="text-md font-semibold">Purchase Orders</h1>
        <p className="text-muted-foreground text-xs">
          Create and manage purchase orders from vendors.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="size-4" />
            Purchase Orders
          </CardTitle>
          <CardDescription>
            Full purchase order management with receiving and stock updates will be available in a future release.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Ensure you have created vendors and warehouses before creating purchase orders.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
