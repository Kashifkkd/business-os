"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateListing } from "@/hooks/use-listings";
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
import { ArrowLeft } from "lucide-react";

export default function NewListingPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;

  const [propertyId, setPropertyId] = useState<string>("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const { data: propertiesData } = useProperties(orgId, { page: 1, pageSize: 100 });
  const properties = propertiesData?.items ?? [];
  const createListing = useCreateListing(orgId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createListing.mutate(
      {
        property_id: propertyId.trim() || null,
        status,
        title: title.trim() || null,
        price: price.trim() ? Number(price) : null,
        description: description.trim() || null,
      },
      {
        onSuccess: (data) => {
          router.push(`/${orgId}/listings/${data.id}`);
        },
        onError: () => {},
      }
    );
  };

  if (!orgId) return null;

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
          <CardTitle>New listing</CardTitle>
          <CardDescription>
            Link a property and add title, price, and description. Set status to draft or published.
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
              <Select value={status} onValueChange={(v) => setStatus(v as "draft" | "published")}>
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
                disabled={createListing.isPending}
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
                disabled={createListing.isPending}
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
                disabled={createListing.isPending}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={createListing.isPending}>
                {createListing.isPending ? "Creating…" : "Create listing"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/${orgId}/listings`}>Cancel</Link>
              </Button>
            </div>
            {createListing.isError && (
              <p className="text-destructive text-sm">
                {createListing.error?.message ?? "Failed to create listing."}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
