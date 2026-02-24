"use client"

import { redirect, useParams } from "next/navigation";

export default function MenuIndexPage() {
  const params = useParams()
  redirect(`/${params.orgId}/menu/items`);
}
