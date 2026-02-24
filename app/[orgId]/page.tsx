"use client";

import { useParams, redirect } from "next/navigation";

export default function OrgRootPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  if (!orgId) return null;
  redirect(`/${orgId}/home`);
}
