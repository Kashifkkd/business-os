"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { SearchCombobox } from "@/components/ui/search-combobox";
import { MenuItemImageUpload } from "./menu-item-image-upload";
import { ConfirmLeaveDialog } from "@/components/confirm-leave-dialog";
import { useCreateMenuItem, useUpdateMenuItem } from "@/hooks/use-menu-items";
import { useMenuCategory } from "@/hooks/use-menu-categories";
import { useInventoryItemsPaginated } from "@/hooks/use-inventory-items";
import {
  useMenuSubCategory,
  useMenuSubcategoriesList,
} from "@/hooks/use-menu-subcategories";
import { useMenuDiscounts } from "@/hooks/use-menu-discounts";
import type { MenuItem } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isArrayWithValues } from "@/lib/is-array-with-values";

const FOOD_TYPE_OPTIONS = ["veg", "non_veg"] as const;

const menuItemFormSchema = z.object({
  name: z.string().min(1, "Menu name is required").trim(),
  description: z.string().optional(),
  long_description: z.string().optional(),
  images: z.array(z.string()),
  sub_category_id: z.string().optional(),
  food_type: z.enum(["veg", "non_veg"]),
  sku: z.string().optional(),
  inventory_item_id: z.string().optional(),
  stock_quantity: z.string().optional(),
  minimum_stock: z.string().optional(),
  price: z
    .string()
    .min(1, "Price is required")
    .refine(
      (s) => {
        const n = parseFloat(s);
        return !Number.isNaN(n) && n > 0;
      },
      { message: "Price must be greater than 0" }
    ),
  minimum_order: z.string().optional(),
  selectedDiscountId: z.string().optional(),
  customSellPrice: z.boolean().optional(),
  customSellPriceValue: z.string().optional(),
});

export type MenuItemFormValues = z.infer<typeof menuItemFormSchema>;

/** Compute sell price from original price and selected discount (for display only; discount not stored on item). */
function computeSellPrice(
  originalPrice: number,
  discountId: string | null,
  discounts: { id: string; type: string; value: number }[]
): number {
  if (!discountId || originalPrice <= 0) return originalPrice;
  const d = discounts.find((x) => x.id === discountId);
  if (!d) return originalPrice;
  if (d.type === "percentage") {
    return Math.max(0, originalPrice * (1 - d.value / 100));
  }
  return Math.max(0, originalPrice - d.value);
}

function getDefaultValues(initialItem?: MenuItem | null): MenuItemFormValues {
  return {
    name: initialItem?.name ?? "",
    description: initialItem?.description ?? "",
    long_description: initialItem?.long_description ?? "",
    images: initialItem?.images ?? [],
    sub_category_id: initialItem?.sub_category_id ?? "",
    food_type: initialItem?.food_type === "non_veg" ? "non_veg" : "veg",
    sku: initialItem?.sku ?? "",
    inventory_item_id: initialItem?.inventory_item_id ?? "",
    stock_quantity:
      initialItem?.stock_quantity != null ? String(initialItem.stock_quantity) : "",
    minimum_stock:
      initialItem?.minimum_stock != null ? String(initialItem.minimum_stock) : "",
    price: initialItem?.price != null ? String(initialItem.price) : "",
    minimum_order:
      initialItem?.minimum_order != null ? String(initialItem.minimum_order) : "1",
    selectedDiscountId: "",
    customSellPrice: false,
    customSellPriceValue:
      initialItem?.discounted_price != null
        ? String(initialItem.discounted_price)
        : "",
  };
}

export interface AddMenuFormProps {
  orgId: string;
  /** When set, form is in edit mode. */
  initialItem?: MenuItem | null;
}

export function AddMenuForm({ orgId, initialItem }: AddMenuFormProps) {
  const router = useRouter();
  const isEdit = !!initialItem?.id;
  const createItem = useCreateMenuItem(orgId);
  const updateItem = useUpdateMenuItem(orgId, initialItem?.id ?? "");
  const { data: categories = [] } = useMenuCategory(orgId);
  const { data: allSubs = [] } = useMenuSubcategoriesList(orgId, {
    categoryId: undefined,
  });
  const [categoryId, setCategoryId] = useState("");
  const { data: subcategories = [] } = useMenuSubCategory(
    orgId,
    categoryId || undefined
  );
  const { data: discounts = [] } = useMenuDiscounts(orgId);
  const { data: inventoryData } = useInventoryItemsPaginated(orgId, { page: 1, pageSize: 100 });
  const inventoryItems = inventoryData?.items ?? [];
  const activeDiscounts = useMemo(
    () => discounts.filter((d) => d.is_active),
    [discounts]
  );

  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: getDefaultValues(initialItem),
  });

  const { watch, setValue, formState, reset, handleSubmit: rhfHandleSubmit } = form;
  const isDirty = formState.isDirty;
  const isSaving = createItem.isPending || updateItem.isPending;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [pendingLeaveHref, setPendingLeaveHref] = useState<string | null>(null);

  // In edit mode, set categoryId from item's sub_category_id when allSubs has loaded
  useEffect(() => {
    if (!initialItem?.sub_category_id || !allSubs.length) return;
    const catId = allSubs.find((s) => s.id === initialItem.sub_category_id)
      ?.category_id;
    if (!catId) return;
    const t = setTimeout(() => setCategoryId(catId), 0);
    return () => clearTimeout(t);
  }, [initialItem?.sub_category_id, allSubs]);

  const priceStr = watch("price");
  const selectedDiscountId = watch("selectedDiscountId");
  const customSellPrice = watch("customSellPrice");
  const customSellPriceValue = watch("customSellPriceValue");
  const originalPriceNum = parseFloat(priceStr || "0") || 0;
  const computedSellPrice = useMemo(
    () =>
      computeSellPrice(
        originalPriceNum,
        selectedDiscountId || null,
        activeDiscounts
      ),
    [originalPriceNum, selectedDiscountId, activeDiscounts]
  );
  const displaySellPrice = customSellPrice
    ? customSellPriceValue ?? ""
    : String(computedSellPrice);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const goToList = useCallback(() => {
    router.push(`/${orgId}/menu/items`);
    router.refresh();
  }, [orgId, router]);

  const onValidSubmit = useCallback(
    async (values: MenuItemFormValues) => {
      setSubmitError(null);
      const priceNum = parseFloat(values.price) || 0;
      const sellPrice =
        values.customSellPrice && values.customSellPriceValue
          ? parseFloat(values.customSellPriceValue) || 0
          : computeSellPrice(
              priceNum,
              values.selectedDiscountId || null,
              activeDiscounts
            );
      const finalSell = sellPrice || priceNum;
      if (finalSell <= 0) {
        setSubmitError("Price is required.");
        return;
      }
      try {
        const payload = {
          name: values.name.trim(),
          description: values.description?.trim() || null,
          long_description: values.long_description?.trim() || null,
          price: priceNum,
          discounted_price: finalSell > 0 ? finalSell : null,
          sub_category_id: values.sub_category_id || null,
          food_type: values.food_type,
          images: values.images,
          sku: values.sku?.trim() || null,
          inventory_item_id: values.inventory_item_id?.trim() || null,
          stock_quantity: values.stock_quantity
            ? parseInt(values.stock_quantity, 10)
            : null,
          minimum_stock: values.minimum_stock
            ? parseInt(values.minimum_stock, 10)
            : null,
          minimum_order: Math.max(
            1,
            values.minimum_order ? parseInt(values.minimum_order, 10) : 1
          ),
        };
        if (isEdit) {
          await updateItem.mutateAsync(payload);
        } else {
          await createItem.mutateAsync(payload);
        }
        goToList();
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Failed to save menu item."
        );
      }
    },
    [activeDiscounts, isEdit, updateItem, createItem, goToList]
  );

  const handleDiscard = () => {
    if (isDirty) {
      setLeaveConfirmOpen(true);
      setPendingLeaveHref("discard");
    } else {
      goToList();
    }
  };

  const handleBackClick = (e: React.MouseEvent) => {
    if (isDirty) {
      e.preventDefault();
      setLeaveConfirmOpen(true);
      setPendingLeaveHref(`/${orgId}/menu/items`);
    }
  };

  const confirmLeave = () => {
    if (pendingLeaveHref === "discard") {
      if (initialItem) {
        reset(getDefaultValues(initialItem));
        setCategoryId(
          allSubs.find((s) => s.id === initialItem.sub_category_id)?.category_id ??
            ""
        );
      } else {
        goToList();
      }
    } else if (pendingLeaveHref) {
      router.push(pendingLeaveHref);
      router.refresh();
    }
    setLeaveConfirmOpen(false);
    setPendingLeaveHref(null);
  };

  const cancelLeave = () => {
    setLeaveConfirmOpen(false);
    setPendingLeaveHref(null);
  };

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto">
      <ConfirmLeaveDialog
        open={leaveConfirmOpen}
        onOpenChange={setLeaveConfirmOpen}
        onConfirmLeave={confirmLeave}
        onCancel={cancelLeave}
        title="Leave without saving?"
        description="You have unsaved changes. Discard them or stay to save."
        leaveLabel="Discard"
        stayLabel="Stay"
      />

      <ScrollArea>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <form
            id="menu-item-form"
            onSubmit={rhfHandleSubmit(onValidSubmit)}
            className="mx-auto max-w-6xl space-y-4 px-2 py-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-row items-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href={`/${orgId}/menu/items`}
                    className="gap-1.5"
                    onClick={handleBackClick}
                  >
                    <ArrowLeft className="size-4" />
                  </Link>
                </Button>
                <h1 className="text-md font-semibold tracking-tight text-foreground">
                  {isEdit ? "Edit Menu Item" : "Add New Menu"}
                </h1>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
              <div className="flex flex-col gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <h2 className="text-sm font-semibold text-foreground">
                      Name & Description
                    </h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Menu Name</Label>
                      <Input
                        id="name"
                        className="h-9"
                        placeholder="e.g. Matcha Latte"
                        {...form.register("name")}
                      />
                      {formState.errors.name && (
                        <p className="text-destructive text-xs">
                          {formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Menu Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Short description..."
                        className="min-h-[80px] resize-y"
                        rows={3}
                        {...form.register("description")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="details">Menu Details</Label>
                      <Textarea
                        id="details"
                        placeholder="One point per line..."
                        className="min-h-[100px] resize-y font-sans"
                        rows={5}
                        {...form.register("long_description")}
                      />
                      <p className="text-muted-foreground text-xs">
                        One detail per line. Shown as bullet points.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <h2 className="text-sm font-semibold text-foreground">
                      Menu Image
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <Controller
                      control={form.control}
                      name="images"
                      render={({ field }) => (
                        <MenuItemImageUpload
                          orgId={orgId}
                          urls={field.value}
                          onChange={field.onChange}
                          disabled={isSaving}
                        />
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <h2 className="text-sm font-semibold text-foreground">
                      Category
                    </h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Food type</Label>
                      <Controller
                        control={form.control}
                        name="food_type"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FOOD_TYPE_OPTIONS.map((ft) => (
                                <SelectItem key={ft} value={ft}>
                                  {ft === "non_veg" ? "Non-veg" : "Veg"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <SearchCombobox
                        options={categoryOptions}
                        value={categoryId}
                        onValueChange={(v) => {
                          setCategoryId(v);
                          setValue("sub_category_id", "");
                        }}
                        placeholder="Search categories…"
                        emptyMessage="No category found."
                        showClear
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sub-category</Label>
                      <Controller
                        control={form.control}
                        name="sub_category_id"
                        render={({ field }) => (
                          <Select
                            value={field.value || undefined}
                            onValueChange={field.onChange}
                            disabled={!categoryId}
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue
                                placeholder={
                                  categoryId
                                    ? "Select sub-category"
                                    : "Select a category first"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {isArrayWithValues(subcategories) && subcategories.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <p className="text-muted-foreground text-xs">
                        Manage categories and sub-categories in the sidebar.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <h2 className="text-sm font-semibold text-foreground">
                      Stock & Inventory
                    </h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">Stock Keeping Unit (SKU)</Label>
                      <Input
                        id="sku"
                        placeholder="e.g. CFFE-MM-01-A9"
                        className="h-9"
                        {...form.register("sku")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Link to Inventory</Label>
                      <Controller
                        control={form.control}
                        name="inventory_item_id"
                        render={({ field }) => (
                          <Select
                            value={field.value || "none"}
                            onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue placeholder="None (use legacy stock)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {inventoryItems.map((i) => (
                                <SelectItem key={i.id} value={i.id}>
                                  {i.name} {i.sku ? `(${i.sku})` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <p className="text-muted-foreground text-xs">
                        Link to an inventory item to use centralized stock. Manage items in Inventory module.
                      </p>
                    </div>
                    {!form.watch("inventory_item_id") && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="stock">Menu Stock</Label>
                          <Input
                            id="stock"
                            type="number"
                            min={0}
                            placeholder="1,000"
                            className="h-9"
                            {...form.register("stock_quantity")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="minStock">Minimum Stock</Label>
                          <Input
                            id="minStock"
                            type="number"
                            min={0}
                            placeholder="500"
                            className="h-9"
                            {...form.register("minimum_stock")}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <h2 className="text-sm font-semibold text-foreground">
                      Menu Pricing
                    </h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="originalPrice">Original Price ($)</Label>
                        <Input
                          id="originalPrice"
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="5.00"
                          className="h-9"
                          {...form.register("price")}
                        />
                        {formState.errors.price && (
                          <p className="text-destructive text-xs">
                            {formState.errors.price.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sellPrice">Sell Price ($)</Label>
                        <Input
                          id="sellPrice"
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="4.50"
                          className="h-9"
                          value={displaySellPrice}
                          onChange={(e) =>
                            setValue("customSellPriceValue", e.target.value, {
                              shouldDirty: true,
                            })
                          }
                          disabled={!customSellPrice}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Discount</Label>
                      <Controller
                        control={form.control}
                        name="selectedDiscountId"
                        render={({ field }) => (
                          <Select
                            value={field.value || "none"}
                            onValueChange={(v) =>
                              field.onChange(v === "none" ? "" : v)
                            }
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {activeDiscounts.map((d) => (
                                <SelectItem key={d.id} value={d.id}>
                                  {d.name} (
                                  {d.type === "percentage"
                                    ? `${d.value}%`
                                    : d.value}
                                  )
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <p className="text-muted-foreground text-xs">
                        Sell price is calculated from discount. Override below if
                        needed.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Controller
                        control={form.control}
                        name="customSellPrice"
                        render={({ field }) => (
                          <>
                            <input
                              type="checkbox"
                              id="customSellPrice"
                              checked={field.value ?? false}
                              onChange={(e) =>
                                field.onChange(e.target.checked)
                              }
                              className="h-4 w-4 rounded border-input"
                            />
                            <Label
                              htmlFor="customSellPrice"
                              className="cursor-pointer font-normal"
                            >
                              Custom Sell Price
                            </Label>
                          </>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minOrder">Minimum Order</Label>
                      <Input
                        id="minOrder"
                        type="number"
                        min={1}
                        placeholder="1"
                        className="h-9"
                        {...form.register("minimum_order")}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </ScrollArea>

      <footer className="shrink-0 border-t border-border bg-background px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          <Button
            type="submit"
            form="menu-item-form"
            disabled={isSaving || !isDirty}
            className={cn(
              "bg-emerald-600 text-white hover:bg-emerald-700",
              "focus-visible:ring-emerald-500/30"
            )}
          >
            <Save className="size-4" />
            {isEdit ? "Save changes" : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDiscard}
            disabled={isSaving}
          >
            <RotateCcw className="size-4" />
            Discard
          </Button>
          {submitError && (
            <span className="text-destructive text-sm">{submitError}</span>
          )}
        </div>
      </footer>
    </div>
  );
}
