"use client";

import { useTenant } from "@/hooks/use-tenant";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TenantOverview() {
  const { tenant } = useTenant();
  if (!tenant) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tenant.name}</CardTitle>
        <CardDescription>{tenant.role}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Welcome to your workspace. Use the sidebar to open Menu & Orders or
          Properties & Listings.
        </p>
      </CardContent>
    </Card>
  );
}
