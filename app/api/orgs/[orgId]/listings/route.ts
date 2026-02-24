import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById, getListings, getListingById } from "@/lib/supabase/queries";
import type { Listing } from "@/lib/supabase/types";

/** GET list of listings. Query: page, pageSize, status */
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
  const status = (searchParams.get("status") ?? "").trim() || undefined;

  const data = await getListings(orgId, { page, pageSize, status });
  return NextResponse.json(apiSuccess(data, data.total));
}

export type CreateListingBody = {
  property_id?: string | null;
  status?: string;
  title?: string | null;
  price?: number | null;
  description?: string | null;
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

  let body: CreateListingBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const status = typeof body.status === "string" && body.status.trim() ? body.status.trim() : "draft";
  const property_id =
    typeof body.property_id === "string" && body.property_id.trim() ? body.property_id.trim() : null;
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : null;
  const price = body.price != null ? Number(body.price) : null;
  const description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;

  const payload = {
    tenant_id: orgId,
    property_id,
    status,
    title,
    price: Number.isNaN(price) ? null : price,
    description,
  };

  const { data: row, error } = await supabase
    .from("listings")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const listing = await getListingById(orgId, row.id);
  return NextResponse.json(apiSuccess(listing as Listing), { status: 201 });
}
