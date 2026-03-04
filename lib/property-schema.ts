import { z } from "zod";

/** RESO-aligned property type values for validation. */
export const PROPERTY_TYPE_VALUES = [
  "residential",
  "commercial",
  "land",
  "industrial",
] as const;

const currentYear = new Date().getFullYear();

export const propertyFormSchema = z.object({
  address: z.string().min(1, "Address is required").trim(),
  type: z.string().trim(),
  address_line_1: z.string().trim(),
  address_line_2: z.string().trim(),
  city: z.string().trim(),
  state_or_province: z.string().trim(),
  postal_code: z.string().trim(),
  country: z.string().trim(),
  property_type: z.string().trim(),
  category_id: z.string().trim().default(""),
  subcategory_id: z.string().trim().default(""),
  bedrooms: z
    .union([z.number().int().min(0).max(99), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v)),
  bathrooms: z
    .union([z.number().min(0).max(99).multipleOf(0.5), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v)),
  half_baths: z
    .union([z.number().int().min(0).max(99), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v)),
  living_area_sqft: z
    .union([z.number().int().min(0), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v)),
  lot_size_sqft: z
    .union([z.number().int().min(0), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v)),
  year_built: z
    .union([
      z.number().int().min(1800).max(currentYear + 2),
      z.nan(),
    ])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v)),
  parcel_number: z.string().trim(),
  reference_id: z.string().trim(),
  notes: z.string().trim(),
  features: z.record(z.string(), z.unknown()).optional().nullable(),
  images: z.array(z.string().url()).default([]),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

export const emptyPropertyFormValues: PropertyFormValues = {
  address: "",
  type: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state_or_province: "",
  postal_code: "",
  country: "",
  property_type: "",
  category_id: "",
  subcategory_id: "",
  bedrooms: undefined,
  bathrooms: undefined,
  half_baths: undefined,
  living_area_sqft: undefined,
  lot_size_sqft: undefined,
  year_built: undefined,
  parcel_number: "",
  reference_id: "",
  notes: "",
  features: null,
  images: [],
};

/** Map form values to API create/update payload (empty strings → null). */
export function propertyFormValuesToPayload(values: PropertyFormValues): {
  address: string;
  type?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state_or_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  property_type?: string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  half_baths?: number | null;
  living_area_sqft?: number | null;
  lot_size_sqft?: number | null;
  year_built?: number | null;
  parcel_number?: string | null;
  reference_id?: string | null;
  notes?: string | null;
  features?: Record<string, unknown> | null;
  images?: string[] | null;
} {
  const opt = (s: string) => (s && s.trim() ? s.trim() : null);
  return {
    address: values.address.trim(),
    type: opt(values.type),
    address_line_1: opt(values.address_line_1),
    address_line_2: opt(values.address_line_2),
    city: opt(values.city),
    state_or_province: opt(values.state_or_province),
    postal_code: opt(values.postal_code),
    country: opt(values.country),
    property_type: opt(values.property_type),
    category_id: values.category_id && values.category_id.trim() ? values.category_id.trim() : null,
    subcategory_id: values.subcategory_id && values.subcategory_id.trim() ? values.subcategory_id.trim() : null,
    bedrooms: values.bedrooms ?? null,
    bathrooms: values.bathrooms ?? null,
    half_baths: values.half_baths ?? null,
    living_area_sqft: values.living_area_sqft ?? null,
    lot_size_sqft: values.lot_size_sqft ?? null,
    year_built: values.year_built ?? null,
    parcel_number: opt(values.parcel_number),
    reference_id: opt(values.reference_id),
    notes: opt(values.notes),
    features: values.features ?? null,
    images: Array.isArray(values.images) && values.images.length > 0 ? values.images : null,
  };
}

/** Form keys that are numeric (null/undefined from API → undefined in form). */
const NUMBER_FORM_KEYS = new Set<keyof PropertyFormValues>([
  "bedrooms",
  "bathrooms",
  "half_baths",
  "living_area_sqft",
  "lot_size_sqft",
  "year_built",
]);

const ARRAY_FORM_KEYS = new Set<keyof PropertyFormValues>(["images"]);

/** Map Property from API to form values (for edit). Uses defaults + overlay; add new fields only to emptyPropertyFormValues. */
export function propertyToFormValues(
  p: Partial<PropertyFormValues> & { address: string }
): PropertyFormValues {
  const result = { ...emptyPropertyFormValues };
  const keys = Object.keys(emptyPropertyFormValues) as (keyof PropertyFormValues)[];
  for (const key of keys) {
    const raw = p[key];
    if (raw === null || raw === undefined) continue;
    if (NUMBER_FORM_KEYS.has(key)) {
      (result as Record<string, unknown>)[key] = raw;
    } else if (key === "features") {
      result.features = raw as Record<string, unknown> | null;
    } else if (ARRAY_FORM_KEYS.has(key)) {
      result.images = Array.isArray(raw) ? [...raw] : [];
    } else {
      (result as Record<string, unknown>)[key] = String(raw);
    }
  }
  result.address = p.address ?? "";
  return result;
}
