"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function BillsPage() {
  const params = useParams();
  const orgId = params?.orgId as string;

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4">
        <h1 className="text-md font-semibold">Vendor Bills</h1>
        <p className="text-muted-foreground text-xs">
          Track and pay bills from vendors.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4" />
            Vendor Bills
          </CardTitle>
          <CardDescription>
            Bill management linked to purchase orders will be available in a future release.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Bills can be linked to purchase orders for streamlined vendor payment tracking.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
