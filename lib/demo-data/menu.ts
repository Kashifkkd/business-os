export type DemoMenuCategorySeed = {
  name: string;
  sort_order: number;
};

export type DemoMenuSubCategorySeed = {
  categoryIndex: number;
  name: string;
  sort_order: number;
};

export type DemoMenuItemSeed = {
  subCategoryIndex: number;
  name: string;
  description: string | null;
  price: number;
  food_type: "veg" | "non_veg";
  dietary_tags: string[];
  prep_time_minutes: number | null;
  sort_order: number;
};

export type DemoMenuDiscountSeed = {
  name: string;
  type: "percentage" | "fixed";
  value: number;
  description: string | null;
};

export const DEMO_MENU_CATEGORIES: DemoMenuCategorySeed[] = [
  { name: "Coffee", sort_order: 0 },
  { name: "Food", sort_order: 1 },
  { name: "Pastries", sort_order: 2 },
  { name: "Drinks", sort_order: 3 },
];

export const DEMO_MENU_SUBCATEGORIES: DemoMenuSubCategorySeed[] = [
  { categoryIndex: 0, name: "Espresso", sort_order: 0 },
  { categoryIndex: 0, name: "Latte", sort_order: 1 },
  { categoryIndex: 0, name: "Cold Brew", sort_order: 2 },
  { categoryIndex: 1, name: "Sandwiches", sort_order: 0 },
  { categoryIndex: 1, name: "Salads", sort_order: 1 },
  { categoryIndex: 2, name: "Croissants", sort_order: 0 },
  { categoryIndex: 2, name: "Cakes", sort_order: 1 },
  { categoryIndex: 3, name: "Fresh Juice", sort_order: 0 },
  { categoryIndex: 3, name: "Smoothies", sort_order: 1 },
];

export const DEMO_MENU_ITEMS: DemoMenuItemSeed[] = [
  { subCategoryIndex: 0, name: "Single Espresso", description: "Single shot", price: 2.5, food_type: "veg", dietary_tags: [], prep_time_minutes: 2, sort_order: 0 },
  { subCategoryIndex: 0, name: "Double Espresso", description: "Double shot", price: 3.5, food_type: "veg", dietary_tags: [], prep_time_minutes: 2, sort_order: 1 },
  { subCategoryIndex: 0, name: "Americano", description: "Espresso with hot water", price: 3.5, food_type: "veg", dietary_tags: [], prep_time_minutes: 3, sort_order: 2 },
  { subCategoryIndex: 1, name: "Latte", description: "Espresso with steamed milk", price: 4.5, food_type: "veg", dietary_tags: ["dairy"], prep_time_minutes: 4, sort_order: 0 },
  { subCategoryIndex: 1, name: "Oat Latte", description: "Latte with oat milk", price: 5, food_type: "veg", dietary_tags: ["vegan"], prep_time_minutes: 4, sort_order: 1 },
  { subCategoryIndex: 1, name: "Cappuccino", description: "Espresso with foamed milk", price: 4.5, food_type: "veg", dietary_tags: ["dairy"], prep_time_minutes: 4, sort_order: 2 },
  { subCategoryIndex: 2, name: "Cold Brew", description: "12oz house cold brew", price: 4, food_type: "veg", dietary_tags: [], prep_time_minutes: 1, sort_order: 0 },
  { subCategoryIndex: 2, name: "Nitro Cold Brew", description: "Nitro tap cold brew", price: 5, food_type: "veg", dietary_tags: [], prep_time_minutes: 1, sort_order: 1 },
  { subCategoryIndex: 3, name: "Club Sandwich", description: "Toasted triple-decker", price: 8.5, food_type: "non_veg", dietary_tags: [], prep_time_minutes: 10, sort_order: 0 },
  { subCategoryIndex: 3, name: "Veggie Wrap", description: "Grilled vegetables with hummus", price: 7.5, food_type: "veg", dietary_tags: ["vegan"], prep_time_minutes: 8, sort_order: 1 },
  { subCategoryIndex: 4, name: "Caesar Salad", description: "Romaine, parmesan, croutons", price: 9, food_type: "non_veg", dietary_tags: ["dairy"], prep_time_minutes: 5, sort_order: 0 },
  { subCategoryIndex: 4, name: "House Salad", description: "Mixed greens, vinaigrette", price: 7, food_type: "veg", dietary_tags: ["vegan"], prep_time_minutes: 5, sort_order: 1 },
  { subCategoryIndex: 5, name: "Butter Croissant", description: "Fresh baked", price: 3.5, food_type: "veg", dietary_tags: ["dairy"], prep_time_minutes: 1, sort_order: 0 },
  { subCategoryIndex: 5, name: "Chocolate Croissant", description: "Pain au chocolat", price: 4.5, food_type: "veg", dietary_tags: ["dairy"], prep_time_minutes: 1, sort_order: 1 },
  { subCategoryIndex: 6, name: "Carrot Cake Slice", description: "Cream cheese frosting", price: 5.5, food_type: "veg", dietary_tags: ["dairy", "gluten"], prep_time_minutes: 1, sort_order: 0 },
  { subCategoryIndex: 6, name: "Brownie", description: "Walnut brownie", price: 4, food_type: "veg", dietary_tags: ["gluten"], prep_time_minutes: 1, sort_order: 1 },
  { subCategoryIndex: 7, name: "Orange Juice", description: "Fresh squeezed", price: 4.5, food_type: "veg", dietary_tags: ["vegan"], prep_time_minutes: 3, sort_order: 0 },
  { subCategoryIndex: 7, name: "Green Juice", description: "Kale, apple, lemon", price: 6, food_type: "veg", dietary_tags: ["vegan"], prep_time_minutes: 4, sort_order: 1 },
  { subCategoryIndex: 8, name: "Berry Smoothie", description: "Mixed berries, yogurt", price: 6.5, food_type: "veg", dietary_tags: ["dairy"], prep_time_minutes: 4, sort_order: 0 },
  { subCategoryIndex: 8, name: "Mango Smoothie", description: "Mango, banana, coconut", price: 6, food_type: "veg", dietary_tags: ["vegan"], prep_time_minutes: 4, sort_order: 1 },
];

export const DEMO_MENU_DISCOUNTS: DemoMenuDiscountSeed[] = [
  { name: "10% Off", type: "percentage", value: 10, description: "Store-wide 10% off" },
  { name: "$1 Off Coffee", type: "fixed", value: 1, description: "$1 off any coffee" },
  { name: "Happy Hour 15%", type: "percentage", value: 15, description: "3–5 PM weekdays" },
];
