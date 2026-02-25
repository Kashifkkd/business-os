import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById, getProperties, getPropertyById } from "@/lib/supabase/queries";
import type { Property } from "@/lib/supabase/types";
import { buildPropertyPayload } from "@/lib/property-api";

/** GET list of properties. Query: page, pageSize, search */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId"), { status: 400 });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant || tenant.industry !== "real_estate") {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Not found or not a real estate org"), { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 10));
  const search = (searchParams.get("search") ?? "").trim() || undefined;

  const data = await getProperties(orgId, { page, pageSize, search });
  return NextResponse.json(apiSuccess(data, data.total));
}

export type CreatePropertyBody = {
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
  features?: Record<string, unknown> | null;
  notes?: string | null;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId"), { status: 400 });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant || tenant.industry !== "real_estate") {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Not found or not a real estate org"), { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(apiError(API_ERROR_CODES.UNAUTHORIZED, "Unauthorized"), { status: 401 });
  }

  let body: CreatePropertyBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const address = typeof body.address === "string" ? body.address.trim() : "";
  if (!address) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Address is required"), { status: 400 });
  }

  const payload = buildPropertyPayload(body as unknown as Record<string, unknown>, {
    forInsert: true,
    createdBy: user.id,
  });
  payload.tenant_id = orgId;
  payload.address = address;
  if (payload.type === undefined) payload.type = typeof body.type === "string" && body.type.trim() ? body.type.trim() : null;

  const { data: row, error } = await supabase
    .from("properties")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const property = await getPropertyById(orgId, row.id);
  return NextResponse.json(apiSuccess(property as Property), { status: 201 });
}
