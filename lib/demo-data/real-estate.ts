export type DemoPropertyCategorySeed = {
  name: string;
  sort_order: number;
};

export type DemoPropertySubCategorySeed = {
  categoryName: string;
  name: string;
  sort_order: number;
};

export type DemoPropertySeed = {
  address: string;
  address_line_1: string;
  city: string;
  state_or_province: string;
  postal_code: string;
  country: string;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  half_baths: number | null;
  living_area_sqft: number | null;
  lot_size_sqft: number | null;
  year_built: number | null;
  notes: string;
};

export type DemoListingSeed = {
  propertyIndex: number;
  status: string;
  title: string;
  price: number;
  description: string;
};

export const DEMO_PROPERTY_CATEGORIES: DemoPropertyCategorySeed[] = [
  { name: "Residential", sort_order: 0 },
  { name: "Commercial", sort_order: 1 },
  { name: "Industrial", sort_order: 2 },
  { name: "Land", sort_order: 3 },
];

export const DEMO_PROPERTY_SUBCATEGORIES: DemoPropertySubCategorySeed[] = [
  { categoryName: "Residential", name: "Single Family", sort_order: 0 },
  { categoryName: "Residential", name: "Condo", sort_order: 1 },
  { categoryName: "Residential", name: "Townhome", sort_order: 2 },
  { categoryName: "Commercial", name: "Office", sort_order: 0 },
  { categoryName: "Commercial", name: "Retail", sort_order: 1 },
  { categoryName: "Industrial", name: "Warehouse", sort_order: 0 },
  { categoryName: "Land", name: "Residential Lot", sort_order: 0 },
];

export const DEMO_PROPERTIES: DemoPropertySeed[] = [
  {
    address: "123 Market Street, San Francisco, CA",
    address_line_1: "123 Market Street",
    city: "San Francisco",
    state_or_province: "CA",
    postal_code: "94105",
    country: "US",
    property_type: "residential",
    bedrooms: 2,
    bathrooms: 2,
    half_baths: 0,
    living_area_sqft: 1200,
    lot_size_sqft: 0,
    year_built: 2015,
    notes: "Downtown loft close to public transit.",
  },
  {
    address: "45 Ocean View Blvd, Santa Cruz, CA",
    address_line_1: "45 Ocean View Blvd",
    city: "Santa Cruz",
    state_or_province: "CA",
    postal_code: "95060",
    country: "US",
    property_type: "residential",
    bedrooms: 4,
    bathrooms: 3.5,
    half_baths: 1,
    living_area_sqft: 2600,
    lot_size_sqft: 6000,
    year_built: 2008,
    notes: "Ocean-view single family home.",
  },
  {
    address: "900 Industrial Way, Oakland, CA",
    address_line_1: "900 Industrial Way",
    city: "Oakland",
    state_or_province: "CA",
    postal_code: "94607",
    country: "US",
    property_type: "industrial",
    bedrooms: null,
    bathrooms: 1,
    half_baths: 0,
    living_area_sqft: 8000,
    lot_size_sqft: 15000,
    year_built: 1998,
    notes: "Warehouse space with loading docks.",
  },
  {
    address: "300 Redwood Ave, Palo Alto, CA",
    address_line_1: "300 Redwood Ave",
    city: "Palo Alto",
    state_or_province: "CA",
    postal_code: "94301",
    country: "US",
    property_type: "commercial",
    bedrooms: null,
    bathrooms: 4,
    half_baths: 0,
    living_area_sqft: 5400,
    lot_size_sqft: 9000,
    year_built: 2010,
    notes: "Mixed-use building with office and retail.",
  },
  {
    address: "15 Meadow Lane, Napa, CA",
    address_line_1: "15 Meadow Lane",
    city: "Napa",
    state_or_province: "CA",
    postal_code: "94558",
    country: "US",
    property_type: "land",
    bedrooms: null,
    bathrooms: null,
    half_baths: null,
    living_area_sqft: null,
    lot_size_sqft: 43560,
    year_built: null,
    notes: "One-acre parcel suitable for custom build.",
  },
  {
    address: "220 Elm Street, Berkeley, CA",
    address_line_1: "220 Elm Street",
    city: "Berkeley",
    state_or_province: "CA",
    postal_code: "94704",
    country: "US",
    property_type: "residential",
    bedrooms: 3,
    bathrooms: 2,
    half_baths: 1,
    living_area_sqft: 1800,
    lot_size_sqft: 4000,
    year_built: 1925,
    notes: "Craftsman-style home near campus.",
  },
  {
    address: "50 Pine Plaza, San Jose, CA",
    address_line_1: "50 Pine Plaza",
    city: "San Jose",
    state_or_province: "CA",
    postal_code: "95110",
    country: "US",
    property_type: "commercial",
    bedrooms: null,
    bathrooms: 6,
    half_baths: 0,
    living_area_sqft: 10000,
    lot_size_sqft: 20000,
    year_built: 2005,
    notes: "Office building with flexible floor plates.",
  },
  {
    address: "5 Vineyard Road, Sonoma, CA",
    address_line_1: "5 Vineyard Road",
    city: "Sonoma",
    state_or_province: "CA",
    postal_code: "95476",
    country: "US",
    property_type: "land",
    bedrooms: null,
    bathrooms: null,
    half_baths: null,
    living_area_sqft: null,
    lot_size_sqft: 217800,
    year_built: null,
    notes: "Five-acre parcel with vineyard potential.",
  },
];

export const DEMO_LISTINGS: DemoListingSeed[] = [
  {
    propertyIndex: 0,
    status: "active",
    title: "Modern downtown loft with skyline views",
    price: 1250000,
    description:
      "Bright 2BR/2BA loft with floor-to-ceiling windows, parking, and easy access to public transit.",
  },
  {
    propertyIndex: 1,
    status: "active",
    title: "Ocean-view family home with large deck",
    price: 1850000,
    description:
      "4BR/3.5BA home with panoramic ocean views, open floor plan, and recent renovations.",
  },
  {
    propertyIndex: 3,
    status: "draft",
    title: "Mixed-use building in prime downtown location",
    price: 4200000,
    description:
      "Retail + office with strong foot traffic and long-term tenants in place.",
  },
  {
    propertyIndex: 4,
    status: "active",
    title: "Build-ready residential lot in wine country",
    price: 450000,
    description:
      "One-acre parcel with gentle slope and utilities at street.",
  },
];

