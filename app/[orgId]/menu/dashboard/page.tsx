"use client";

import { useParams } from "next/navigation";
import { CafeDashboard } from "@/components/dashboard/cafe-dashboard";

export default function MenuDashboardPage() {
  const params = useParams();
  const orgId = params?.orgId as string;

  if (!orgId) return null;

  return <CafeDashboard orgId={orgId} showHeading />;
}
