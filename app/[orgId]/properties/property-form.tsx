"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  propertyFormSchema,
  type PropertyFormValues,
  emptyPropertyFormValues,
  propertyFormValuesToPayload,
  PROPERTY_TYPE_VALUES,
} from "@/lib/property-schema";
import type { CreatePropertyPayload, UpdatePropertyPayload } from "@/hooks/use-properties";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePropertyCategoriesList } from "@/hooks/use-property-categories";
import { usePropertySubcategoriesList } from "@/hooks/use-property-subcategories";

export type PropertyFormProps = {
  orgId: string;
  initialValues: PropertyFormValues;
  mode: "create" | "edit";
  onSubmit: (payload: CreatePropertyPayload | UpdatePropertyPayload) => void;
  onCancel: () => void;
  isPending?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
};

export function PropertyForm({
  orgId,
  initialValues,
  mode,
  onSubmit,
  onCancel,
  isPending = false,
  onDelete,
  isDeleting = false,
}: PropertyFormProps) {
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: initialValues,
  });

  const categoryId = form.watch("category_id") || undefined;
  const { data: categories = [] } = usePropertyCategoriesList(orgId);
  const { data: subcategories = [] } = usePropertySubcategoriesList(orgId, {
    categoryId: categoryId && categoryId.length > 0 ? categoryId : undefined,
  });

  useEffect(() => {
    form.reset(initialValues);
  }, [initialValues, form]);

  const handleSubmit = form.handleSubmit((values) => {
    const payload = propertyFormValuesToPayload(values);
    onSubmit(payload);
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            Address
          </CardTitle>
          <CardDescription>
            Full address and structured address fields (optional).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Address (display) *</Label>
            <Input
              id="address"
              {...form.register("address")}
              placeholder="123 Main St, City, State ZIP"
              disabled={isPending}
              className="h-9"
            />
            {form.formState.errors.address && (
              <p className="text-destructive text-xs">
                {form.formState.errors.address.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="address_line_1">Street address</Label>
              <Input
                id="address_line_1"
                {...form.register("address_line_1")}
                placeholder="123 Main St"
                disabled={isPending}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_line_2">Unit, suite, building</Label>
              <Input
                id="address_line_2"
                {...form.register("address_line_2")}
                placeholder="Apt 4B"
                disabled={isPending}
                className="h-9"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...form.register("city")}
                placeholder="City"
                disabled={isPending}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state_or_province">State / Province</Label>
              <Input
                id="state_or_province"
                {...form.register("state_or_province")}
                placeholder="State"
                disabled={isPending}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal code</Label>
              <Input
                id="postal_code"
                {...form.register("postal_code")}
                placeholder="ZIP"
                disabled={isPending}
                className="h-9"
              />
            </div>
          </div>
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              {...form.register("country")}
              placeholder="e.g. US, IN"
              disabled={isPending}
              className="h-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            Classification
          </CardTitle>
          <CardDescription>
            Property type and category (optional).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type (free text)</Label>
            <Input
              id="type"
              {...form.register("type")}
              placeholder="e.g. apartment, house, condo"
              disabled={isPending}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label>Property type</Label>
            <Controller
              control={form.control}
              name="property_type"
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onValueChange={(v) => field.onChange(v || "")}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPE_VALUES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Controller
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={(v) => {
                      field.onChange(v || "");
                      form.setValue("subcategory_id", "");
                    }}
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Controller
                control={form.control}
                name="subcategory_id"
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={(v) => field.onChange(v || "")}
                    disabled={isPending || !categoryId}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            Characteristics
          </CardTitle>
          <CardDescription>
            Beds, baths, area, lot, year built.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Controller
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <Input
                    id="bedrooms"
                    type="number"
                    min={0}
                    max={99}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === "" ? undefined : Number(v));
                    }}
                    disabled={isPending}
                    className="h-9"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Controller
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <Input
                    id="bathrooms"
                    type="number"
                    min={0}
                    step={0.5}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === "" ? undefined : Number(v));
                    }}
                    disabled={isPending}
                    className="h-9"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="half_baths">Half baths</Label>
              <Controller
                control={form.control}
                name="half_baths"
                render={({ field }) => (
                  <Input
                    id="half_baths"
                    type="number"
                    min={0}
                    max={99}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === "" ? undefined : Number(v));
                    }}
                    disabled={isPending}
                    className="h-9"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="living_area_sqft">Living area (sq ft)</Label>
              <Controller
                control={form.control}
                name="living_area_sqft"
                render={({ field }) => (
                  <Input
                    id="living_area_sqft"
                    type="number"
                    min={0}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === "" ? undefined : Number(v));
                    }}
                    disabled={isPending}
                    className="h-9"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lot_size_sqft">Lot size (sq ft)</Label>
              <Controller
                control={form.control}
                name="lot_size_sqft"
                render={({ field }) => (
                  <Input
                    id="lot_size_sqft"
                    type="number"
                    min={0}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === "" ? undefined : Number(v));
                    }}
                    disabled={isPending}
                    className="h-9"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year_built">Year built</Label>
              <Controller
                control={form.control}
                name="year_built"
                render={({ field }) => (
                  <Input
                    id="year_built"
                    type="number"
                    min={1800}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === "" ? undefined : Number(v));
                    }}
                    disabled={isPending}
                    className="h-9"
                  />
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            Identifiers & notes
          </CardTitle>
          <CardDescription>
            Parcel number, reference ID, and internal notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="parcel_number">Parcel number</Label>
              <Input
                id="parcel_number"
                {...form.register("parcel_number")}
                placeholder="Tax/parcel ID"
                disabled={isPending}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference_id">Reference ID</Label>
              <Input
                id="reference_id"
                {...form.register("reference_id")}
                placeholder="e.g. MLS ID"
                disabled={isPending}
                className="h-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Internal notes"
              disabled={isPending}
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={isPending} size="sm">
          {isPending
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create property"
              : "Save changes"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        {mode === "edit" && onDelete && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        )}
      </div>
    </form>
  );
}

export { emptyPropertyFormValues, propertyToFormValues };
