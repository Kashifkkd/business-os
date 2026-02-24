"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  useMenuSubCategory,
  useMenuSubcategoriesList,
} from "@/hooks/use-menu-subcategories";
import { useMenuDiscounts } from "@/hooks/use-menu-discounts";
import type { MenuItem } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const FOOD_TYPE_OPTIONS = ["veg", "non_veg"] as const;

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
  const { data: allSubs = [] } = useMenuSubcategoriesList(orgId, { categoryId: undefined });
  const [categoryId, setCategoryId] = useState("");
  const { data: subcategories = [] } = useMenuSubCategory(orgId, categoryId || undefined);
  const { data: discounts = [] } = useMenuDiscounts(orgId);
  const activeDiscounts = useMemo(() => discounts.filter((d) => d.is_active), [discounts]);

  // In edit mode, set initial categoryId from item's sub_category_id when allSubs has loaded (defer to avoid sync setState in effect)
  useEffect(() => {
    if (!initialItem?.sub_category_id || !allSubs.length) return;
    const catId = allSubs.find((s) => s.id === initialItem.sub_category_id)?.category_id;
    if (!catId) return;
    const t = setTimeout(() => setCategoryId(catId), 0);
    return () => clearTimeout(t);
  }, [initialItem?.sub_category_id, allSubs]);

  const [name, setName] = useState(initialItem?.name ?? "");
  const [description, setDescription] = useState(initialItem?.description ?? "");
  const [menuDetails, setMenuDetails] = useState(initialItem?.long_description ?? "");
  const [images, setImages] = useState<string[]>(initialItem?.images ?? []);
  const [subCategoryId, setSubCategoryId] = useState(initialItem?.sub_category_id ?? "");
  const [foodType, setFoodType] = useState<"veg" | "non_veg">(
    initialItem?.food_type === "non_veg" ? "non_veg" : "veg"
  );
  const [sku, setSku] = useState(initialItem?.sku ?? "");
  const [stockQuantity, setStockQuantity] = useState(
    initialItem?.stock_quantity != null ? String(initialItem.stock_quantity) : ""
  );
  const [minimumStock, setMinimumStock] = useState(
    initialItem?.minimum_stock != null ? String(initialItem.minimum_stock) : ""
  );
  const [originalPrice, setOriginalPrice] = useState(
    initialItem?.price != null ? String(initialItem.price) : ""
  );
  const [selectedDiscountId, setSelectedDiscountId] = useState<string>("");
  const [customSellPrice, setCustomSellPrice] = useState(false);
  const [customSellPriceValue, setCustomSellPriceValue] = useState(
    initialItem?.discounted_price != null ? String(initialItem.discounted_price) : ""
  );
  const [minimumOrder, setMinimumOrder] = useState(
    initialItem?.minimum_order != null ? String(initialItem.minimum_order) : "1"
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [pendingLeaveHref, setPendingLeaveHref] = useState<string | null>(null);

  const originalPriceNum = parseFloat(originalPrice) || 0;
  const computedSellPrice = useMemo(
    () => computeSellPrice(originalPriceNum, selectedDiscountId || null, activeDiscounts),
    [originalPriceNum, selectedDiscountId, activeDiscounts]
  );
  const sellPriceNum = customSellPrice
    ? parseFloat(customSellPriceValue) || 0
    : computedSellPrice;
  const displaySellPrice = customSellPrice ? customSellPriceValue : String(computedSellPrice);

  const buildPayload = useCallback(
    () => ({
      name: name.trim(),
      description: description.trim() || null,
      long_description: menuDetails.trim() || null,
      price: originalPriceNum,
      discounted_price: sellPriceNum > 0 ? sellPriceNum : null,
      sub_category_id: subCategoryId || null,
      food_type: foodType,
      images,
      sku: sku.trim() || null,
      stock_quantity: stockQuantity ? parseInt(stockQuantity, 10) : null,
      minimum_stock: minimumStock ? parseInt(minimumStock, 10) : null,
      minimum_order: minimumOrder ? Math.max(1, parseInt(minimumOrder, 10)) : 1,
    }),
    [
      name,
      description,
      menuDetails,
      originalPriceNum,
      sellPriceNum,
      subCategoryId,
      foodType,
      images,
      sku,
      stockQuantity,
      minimumStock,
      minimumOrder,
    ]
  );

  const initialSnapshot = JSON.stringify({
    name: initialItem?.name ?? "",
    description: initialItem?.description ?? "",
    menuDetails: initialItem?.long_description ?? "",
    images: initialItem?.images ?? [],
    subCategoryId: initialItem?.sub_category_id ?? "",
    categoryId: "",
    foodType: initialItem?.food_type === "non_veg" ? "non_veg" : "veg",
    sku: initialItem?.sku ?? "",
    stockQuantity: initialItem?.stock_quantity != null ? String(initialItem.stock_quantity) : "",
    minimumStock: initialItem?.minimum_stock != null ? String(initialItem.minimum_stock) : "",
    originalPrice: initialItem?.price != null ? String(initialItem.price) : "",
    selectedDiscountId: "",
    customSellPrice: false,
    customSellPriceValue: initialItem?.discounted_price != null ? String(initialItem.discounted_price) : "",
    minimumOrder: initialItem?.minimum_order != null ? String(initialItem.minimum_order) : "1",
  });

  const currentSnapshot = JSON.stringify({
    name,
    description,
    menuDetails,
    images,
    subCategoryId,
    categoryId,
    foodType,
    sku,
    stockQuantity,
    minimumStock,
    originalPrice,
    selectedDiscountId,
    customSellPrice,
    customSellPriceValue,
    minimumOrder,
  });

  const isDirty = initialSnapshot !== currentSnapshot;
  const isSaving = createItem.isPending || updateItem.isPending;

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

  const handleSave = async () => {
    setSubmitError(null);
    const nameTrim = name.trim();
    if (!nameTrim) {
      setSubmitError("Menu name is required.");
      return;
    }
    const finalSell = sellPriceNum || originalPriceNum;
    if (finalSell <= 0) {
      setSubmitError("Price is required.");
      return;
    }
    try {
      const payload = buildPayload();
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
  };

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
        setName(initialItem.name ?? "");
        setDescription(initialItem.description ?? "");
        setMenuDetails(initialItem.long_description ?? "");
        setImages(initialItem.images ?? []);
        setSubCategoryId(initialItem.sub_category_id ?? "");
        setCategoryId(allSubs.find((s) => s.id === initialItem.sub_category_id)?.category_id ?? "");
        setFoodType(initialItem.food_type === "non_veg" ? "non_veg" : "veg");
        setSku(initialItem.sku ?? "");
        setStockQuantity(
          initialItem.stock_quantity != null ? String(initialItem.stock_quantity) : ""
        );
        setMinimumStock(
          initialItem.minimum_stock != null ? String(initialItem.minimum_stock) : ""
        );
        setOriginalPrice(initialItem.price != null ? String(initialItem.price) : "");
        setSelectedDiscountId("");
        setCustomSellPrice(false);
        setCustomSellPriceValue(
          initialItem.discounted_price != null ? String(initialItem.discounted_price) : ""
        );
        setMinimumOrder(
          initialItem.minimum_order != null ? String(initialItem.minimum_order) : "1"
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
          <div className="mx-auto max-w-6xl space-y-4 px-2 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-row gap-1 items-center">
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
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Matcha Latte"
                        className="h-9"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Menu Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Short description..."
                        className="min-h-[80px] resize-y"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="details">Menu Details</Label>
                      <Textarea
                        id="details"
                        value={menuDetails}
                        onChange={(e) => setMenuDetails(e.target.value)}
                        placeholder="One point per line..."
                        className="min-h-[100px] resize-y font-sans"
                        rows={5}
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
                    <MenuItemImageUpload
                      orgId={orgId}
                      urls={images}
                      onChange={setImages}
                      disabled={isSaving}
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
                      <Select
                        value={foodType}
                        onValueChange={(v) => setFoodType(v as "veg" | "non_veg")}
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
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <SearchCombobox
                        options={categoryOptions}
                        value={categoryId}
                        onValueChange={(v) => {
                          setCategoryId(v);
                          setSubCategoryId("");
                        }}
                        placeholder="Search categories…"
                        emptyMessage="No category found."
                        showClear
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sub-category</Label>
                      <Select
                        value={subCategoryId || undefined}
                        onValueChange={setSubCategoryId}
                        disabled={!categoryId}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder={categoryId ? "Select sub-category" : "Select a category first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {subcategories.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-muted-foreground text-xs">
                        Manage categories and sub-categories in the sidebar.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <h2 className="text-sm font-semibold text-foreground">
                      Manage Stock
                    </h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">Stock Keeping Item (SKU)</Label>
                      <Input
                        id="sku"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="e.g. CFFE-MM-01-A9"
                        className="h-9"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="stock">Menu Stock</Label>
                        <Input
                          id="stock"
                          type="number"
                          min={0}
                          value={stockQuantity}
                          onChange={(e) => setStockQuantity(e.target.value)}
                          placeholder="1,000"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minStock">Minimum Stock</Label>
                        <Input
                          id="minStock"
                          type="number"
                          min={0}
                          value={minimumStock}
                          onChange={(e) => setMinimumStock(e.target.value)}
                          placeholder="500"
                          className="h-9"
                        />
                      </div>
                    </div>
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
                          value={originalPrice}
                          onChange={(e) => setOriginalPrice(e.target.value)}
                          placeholder="5.00"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sellPrice">Sell Price ($)</Label>
                        <Input
                          id="sellPrice"
                          type="number"
                          step="0.01"
                          min={0}
                          value={displaySellPrice}
                          onChange={(e) => setCustomSellPriceValue(e.target.value)}
                          disabled={!customSellPrice}
                          placeholder="4.50"
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Discount</Label>
                      <Select
                        value={selectedDiscountId || "none"}
                        onValueChange={(v) => setSelectedDiscountId(v === "none" ? "" : v)}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {activeDiscounts.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name} ({d.type === "percentage" ? `${d.value}%` : d.value})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-muted-foreground text-xs">
                        Sell price is calculated from discount. Override below if needed.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="customSellPrice"
                        checked={customSellPrice}
                        onChange={(e) => setCustomSellPrice(e.target.checked)}
                        className="h-4 w-4 rounded border-input"
                      />
                      <Label htmlFor="customSellPrice" className="font-normal cursor-pointer">
                        Custom Sell Price
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minOrder">Minimum Order</Label>
                      <Input
                        id="minOrder"
                        type="number"
                        min={1}
                        value={minimumOrder}
                        onChange={(e) => setMinimumOrder(e.target.value)}
                        placeholder="1"
                        className="h-9"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      <footer className="shrink-0 border-t border-border bg-background px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={handleSave}
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
