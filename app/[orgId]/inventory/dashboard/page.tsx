"use client";

import { useParams } from "next/navigation";
import { InventoryDashboard } from "@/components/dashboard/inventory-dashboard";

export default function InventoryDashboardPage() {
  const params = useParams();
  const orgId = params?.orgId as string;

  if (!orgId) return null;

  return <InventoryDashboard orgId={orgId} />;
}
