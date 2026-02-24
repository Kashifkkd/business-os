"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useProperty, useUpdateProperty, useDeleteProperty } from "@/hooks/use-properties";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;

  const { data: property, isLoading, isError } = useProperty(orgId, id);
  const updateProperty = useUpdateProperty(orgId, id);
  const deleteProperty = useDeleteProperty(orgId);

  const [address, setAddress] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    if (property) {
      setAddress(property.address);
      setType(property.type ?? "");
    }
  }, [property]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const addressTrim = address.trim();
    if (!addressTrim) return;
    updateProperty.mutate(
      { address: addressTrim, type: type.trim() || null },
      { onError: () => {} }
    );
  };

  const handleDelete = () => {
    deleteProperty.mutate(id, {
      onSuccess: () => {
        router.push(`/${orgId}/properties`);
      },
    });
  };

  if (!orgId || !id) return null;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl p-4">
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
    <div className="container mx-auto max-w-2xl p-4">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${orgId}/properties`}>
            <ArrowLeft className="size-3.5" />
            Back to properties
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit property</CardTitle>
          <CardDescription>
            Update the address and property type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City"
                required
                disabled={updateProperty.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type (optional)</Label>
              <Input
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="e.g. apartment, house, condo"
                disabled={updateProperty.isPending}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button type="submit" disabled={updateProperty.isPending}>
                {updateProperty.isPending ? "Saving…" : "Save changes"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/${orgId}/properties`}>Cancel</Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    disabled={deleteProperty.isPending}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete property?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete &quot;{property.address}&quot;. Listings linked to this property may be affected. This cannot be undone.
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
