"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useListing, useUpdateListing, useDeleteListing } from "@/hooks/use-listings";
import { useProperties } from "@/hooks/use-properties";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;

  const { data: listing, isLoading, isError } = useListing(orgId, id);
  const { data: propertiesData } = useProperties(orgId, { page: 1, pageSize: 100 });
  const properties = propertiesData?.items ?? [];
  const updateListing = useUpdateListing(orgId, id);
  const deleteListing = useDeleteListing(orgId);

  const [propertyId, setPropertyId] = useState("");
  const [status, setStatus] = useState<string>("draft");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (listing) {
      setPropertyId(listing.property_id ?? "");
      setStatus(listing.status ?? "draft");
      setTitle(listing.title ?? "");
      setPrice(listing.price != null ? String(listing.price) : "");
      setDescription(listing.description ?? "");
    }
  }, [listing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateListing.mutate(
      {
        property_id: propertyId.trim() || null,
        status: status.trim() || "draft",
        title: title.trim() || null,
        price: price.trim() ? Number(price) : null,
        description: description.trim() || null,
      },
      { onError: () => {} }
    );
  };

  const handleDelete = () => {
    deleteListing.mutate(id, {
      onSuccess: () => {
        router.push(`/${orgId}/listings`);
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

  if (isError || !listing) {
    router.replace(`/${orgId}/listings`);
    return null;
  }

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${orgId}/listings`}>
            <ArrowLeft className="size-3.5" />
            Back to listings
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit listing</CardTitle>
          <CardDescription>
            Update property, status, title, price, and description. Change status to published to make it live.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Property (optional)</Label>
              <Select value={propertyId} onValueChange={setPropertyId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.address}
                      {p.type ? ` (${p.type})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Listing headline"
                disabled={updateListing.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (optional)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                disabled={updateListing.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Full description"
                rows={4}
                className="border-input focus-visible:ring-ring w-full rounded-lg border bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 disabled:opacity-50"
                disabled={updateListing.isPending}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button type="submit" disabled={updateListing.isPending}>
                {updateListing.isPending ? "Saving…" : "Save changes"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/${orgId}/listings`}>Cancel</Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    disabled={deleteListing.isPending}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this listing. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteListing.isPending ? "Deleting…" : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            {updateListing.isError && (
              <p className="text-destructive text-sm">
                {updateListing.error?.message ?? "Failed to update listing."}
              </p>
            )}
            {deleteListing.isError && (
              <p className="text-destructive text-sm">
                {deleteListing.error?.message ?? "Failed to delete listing."}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
