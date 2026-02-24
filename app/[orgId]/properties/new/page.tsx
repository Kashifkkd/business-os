"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateProperty } from "@/hooks/use-properties";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

export default function NewPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;

  const [address, setAddress] = useState("");
  const [type, setType] = useState("");

  const createProperty = useCreateProperty(orgId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const addressTrim = address.trim();
    if (!addressTrim) return;
    createProperty.mutate(
      { address: addressTrim, type: type.trim() || null },
      {
        onSuccess: (data) => {
          router.push(`/${orgId}/properties/${data.id}`);
        },
        onError: () => {},
      }
    );
  };

  if (!orgId) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mx-auto w-full max-w-6xl space-y-4 px-2 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-row items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${orgId}/properties`} className="gap-1.5">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-md font-semibold tracking-tight text-foreground">
              Add property
            </h1>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Property details
            </CardTitle>
            <CardDescription>
              Enter the address and optional property type (e.g. apartment,
              house).
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
                  disabled={createProperty.isPending}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type (optional)</Label>
                <Input
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="e.g. apartment, house, condo"
                  disabled={createProperty.isPending}
                  className="h-9"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={createProperty.isPending}
                  size="sm"
                >
                  {createProperty.isPending ? "Creating…" : "Create property"}
                </Button>
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={`/${orgId}/properties`}>Cancel</Link>
                </Button>
              </div>
              {createProperty.isError && (
                <p className="text-destructive text-sm">
                  {createProperty.error?.message ?? "Failed to create property."}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
