import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById, getPropertyById } from "@/lib/supabase/queries";
import type { Property } from "@/lib/supabase/types";

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

  const property = await getPropertyById(orgId, id);
  if (!property) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Property not found"), { status: 404 });
  }

  return NextResponse.json(apiSuccess(property));
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

  const existing = await getPropertyById(orgId, id);
  if (!existing) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Property not found"), { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.address === "string") {
    const addressTrim = body.address.trim();
    if (!addressTrim) {
      return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Address is required"), { status: 400 });
    }
    payload.address = addressTrim;
  }
  if (body.type !== undefined) {
    payload.type = typeof body.type === "string" && body.type.trim() ? body.type.trim() : null;
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(apiSuccess(existing));
  }

  const { error } = await supabase
    .from("properties")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const property = await getPropertyById(orgId, id);
  return NextResponse.json(apiSuccess(property as Property));
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

  const existing = await getPropertyById(orgId, id);
  if (!existing) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Property not found"), { status: 404 });
  }

  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", id)
    .eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess({ deleted: true }));
}
