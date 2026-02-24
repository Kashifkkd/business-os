"use client";

import { useParams } from "next/navigation";
import { AddMenuForm } from "./add-menu-form";

export default function NewMenuItemPage() {
  const params = useParams();
  const orgId = params?.orgId as string;

  if (!orgId) return null;

  return (
    <div className="h-full w-full min-h-0 flex flex-col">
      <AddMenuForm orgId={orgId} />
    </div>
  );
}
