"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";

export default function SalesOrdersPage() {
  const params = useParams();
  const orgId = params?.orgId as string;

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4">
        <h1 className="text-md font-semibold">Sales Orders</h1>
        <p className="text-muted-foreground text-xs">
          Create and manage sales orders.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="size-4" />
            Sales Orders
          </CardTitle>
          <CardDescription>
            Full sales order management with picklists and packages will be available in a future release.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Sales orders will deduct stock when fulfilled and integrate with picklists for warehouse picking.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
