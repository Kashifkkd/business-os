"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useCreateProperty,
  type CreatePropertyPayload,
  type UpdatePropertyPayload,
} from "@/hooks/use-properties";
import { Button } from "@/components/ui/button";
import { PropertyForm, emptyPropertyFormValues } from "../property-form";
import { ArrowLeft } from "lucide-react";

export default function NewPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;

  const createProperty = useCreateProperty(orgId);

  const handleSubmit = (
    payload: CreatePropertyPayload | UpdatePropertyPayload
  ) => {
    createProperty.mutate(payload as CreatePropertyPayload, {
      onSuccess: (data) => {
        router.push(`/${orgId}/properties/${data.id}`);
      },
      onError: () => {},
    });
  };

  if (!orgId) return null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl space-y-4 px-2 py-4">
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

        <PropertyForm
          orgId={orgId}
          initialValues={emptyPropertyFormValues}
          mode="create"
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isPending={createProperty.isPending}
        />

        {createProperty.isError && (
          <p className="text-destructive text-sm">
            {createProperty.error?.message ?? "Failed to create property."}
          </p>
        )}
      </div>
    </div>
  );
}
