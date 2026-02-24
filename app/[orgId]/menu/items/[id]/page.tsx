"use client";

import { useParams, useRouter } from "next/navigation";
import { useMenuItem } from "@/hooks/use-menu-items";
import { AddMenuForm } from "../new/add-menu-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditMenuItemPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;

  const { data: item, isLoading, isError } = useMenuItem(orgId, id);

  if (!orgId || !id) return null;

  if (isLoading) {
    return (
      <div className="h-full w-full min-h-0 flex flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl space-y-6 p-4">
            <div className="flex justify-between">
              <div className="space-y-2">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-8 w-28" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><Skeleton className="h-4 w-32" /></CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !item) {
    router.replace(`/${orgId}/menu/items`);
    return null;
  }

  return (
    <div className="h-full w-full min-h-0 flex flex-col overflow-auto">
      <AddMenuForm key={item.id} orgId={orgId} initialItem={item} />
    </div>
  );
}
