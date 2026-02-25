/**
 * Shared validation and payload building for property API (create/update).
 */

function parseOptionalInt(
  v: unknown,
  min: number,
  max: number
): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return undefined;
  if (n < min || n > max) return undefined;
  return n;
}

function parseOptionalNumeric(
  v: unknown,
  min: number,
  max: number
): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) return undefined;
  return n;
}

export interface BuildPropertyPayloadOptions {
  forInsert: boolean;
  createdBy?: string;
}

export function buildPropertyPayload(
  body: Record<string, unknown>,
  options: BuildPropertyPayloadOptions
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const str = (key: string) =>
    typeof body[key] === "string" && (body[key] as string).trim()
      ? (body[key] as string).trim()
      : null;
  if (!options.forInsert && body.address !== undefined) {
    const a = typeof body.address === "string" ? body.address.trim() : null;
    payload.address = a || null;
  }
  if (body.type !== undefined) payload.type = str("type");
  if (body.address_line_1 !== undefined) payload.address_line_1 = str("address_line_1");
  if (body.address_line_2 !== undefined) payload.address_line_2 = str("address_line_2");
  if (body.city !== undefined) payload.city = str("city");
  if (body.state_or_province !== undefined) payload.state_or_province = str("state_or_province");
  if (body.postal_code !== undefined) payload.postal_code = str("postal_code");
  if (body.country !== undefined) payload.country = str("country");
  if (body.property_type !== undefined) payload.property_type = str("property_type");
  if (body.category_id !== undefined) {
    const s =
      typeof body.category_id === "string" && body.category_id.trim()
        ? body.category_id.trim()
        : null;
    payload.category_id = s;
  }
  if (body.subcategory_id !== undefined) {
    const s =
      typeof body.subcategory_id === "string" && body.subcategory_id.trim()
        ? body.subcategory_id.trim()
        : null;
    payload.subcategory_id = s;
  }
  const currentYear = new Date().getFullYear();
  if (body.bedrooms !== undefined) payload.bedrooms = parseOptionalInt(body.bedrooms, 0, 99);
  if (body.bathrooms !== undefined) payload.bathrooms = parseOptionalNumeric(body.bathrooms, 0, 99);
  if (body.half_baths !== undefined) payload.half_baths = parseOptionalInt(body.half_baths, 0, 99);
  if (body.living_area_sqft !== undefined)
    payload.living_area_sqft = parseOptionalInt(body.living_area_sqft, 0, 99_999_999);
  if (body.lot_size_sqft !== undefined)
    payload.lot_size_sqft = parseOptionalInt(body.lot_size_sqft, 0, 99_999_999);
  if (body.year_built !== undefined)
    payload.year_built = parseOptionalInt(body.year_built, 1800, currentYear + 2);
  if (body.parcel_number !== undefined) payload.parcel_number = str("parcel_number");
  if (body.reference_id !== undefined) payload.reference_id = str("reference_id");
  if (body.features !== undefined) {
    payload.features =
      body.features !== null &&
      typeof body.features === "object" &&
      !Array.isArray(body.features)
        ? body.features
        : null;
  }
  if (body.notes !== undefined) payload.notes = str("notes");
  if (options.forInsert && options.createdBy) payload.created_by = options.createdBy;
  return payload;
}
