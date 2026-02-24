import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById, getListingById } from "@/lib/supabase/queries";
import type { Listing } from "@/lib/supabase/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId or id"), { status: 400 });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant || tenant.industry !== "real_estate") {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Not found or not a real estate org"), { status: 404 });
  }

  const listing = await getListingById(orgId, id);
  if (!listing) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Listing not found"), { status: 404 });
  }

  return NextResponse.json(apiSuccess(listing));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId or id"), { status: 400 });
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

  const existing = await getListingById(orgId, id);
  if (!existing) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Listing not found"), { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (body.property_id !== undefined) {
    payload.property_id =
      typeof body.property_id === "string" && body.property_id.trim() ? body.property_id.trim() : null;
  }
  if (body.status !== undefined) {
    payload.status = typeof body.status === "string" && body.status.trim() ? body.status.trim() : "draft";
  }
  if (body.title !== undefined) {
    payload.title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : null;
  }
  if (body.price !== undefined) {
    const price = body.price != null ? Number(body.price) : null;
    payload.price = price != null && !Number.isNaN(price) ? price : null;
  }
  if (body.description !== undefined) {
    payload.description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;
  }
  if (body.published_at !== undefined) {
    payload.published_at = typeof body.published_at === "string" && body.published_at.trim() ? body.published_at : null;
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(apiSuccess(existing));
  }

  if (payload.status === "published" && !existing.published_at) {
    payload.published_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("listings")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const listing = await getListingById(orgId, id);
  return NextResponse.json(apiSuccess(listing as Listing));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId or id"), { status: 400 });
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

  const existing = await getListingById(orgId, id);
  if (!existing) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Listing not found"), { status: 404 });
  }

  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess({ deleted: true }));
}
