"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useProperty, useUpdateProperty, useDeleteProperty } from "@/hooks/use-properties";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyForm } from "../property-form";
import { propertyToFormValues } from "@/lib/property-schema";
import { ArrowLeft } from "lucide-react";

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;

  const { data: property, isLoading, isError } = useProperty(orgId, id);
  const updateProperty = useUpdateProperty(orgId, id);
  const deleteProperty = useDeleteProperty(orgId);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const handleSubmit = (payload: Parameters<typeof updateProperty.mutate>[0]) => {
    updateProperty.mutate(payload, { onError: () => {} });
  };

  const handleDelete = () => {
    deleteProperty.mutate(id, {
      onSuccess: () => {
        setOpenDeleteDialog(false);
        router.push(`/${orgId}/properties`);
      },
    });
  };

  if (!orgId || !id) return null;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <div className="mb-4">
          <Skeleton className="h-8 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !property) {
    router.replace(`/${orgId}/properties`);
    return null;
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="container mx-auto max-w-4xl space-y-4 p-4">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${orgId}/properties`}>
              <ArrowLeft className="size-3.5" />
              Back to properties
            </Link>
          </Button>
        </div>

        <PropertyForm
          key={property.id}
          orgId={orgId}
          initialValues={propertyToFormValues(property)}
          mode="edit"
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isPending={updateProperty.isPending}
          onDelete={() => setOpenDeleteDialog(true)}
          isDeleting={deleteProperty.isPending}
        />

        {updateProperty.isError && (
          <p className="text-destructive text-sm">
            {updateProperty.error?.message ?? "Failed to update property."}
          </p>
        )}
        {deleteProperty.isError && (
          <p className="text-destructive text-sm">
            {deleteProperty.error?.message ?? "Failed to delete property."}
          </p>
        )}
      </div>

      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete property?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{property.address}&quot;. Listings
              linked to this property may be affected. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProperty.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
