import { NextResponse } from "next/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById, getMenuCategories } from "@/lib/supabase/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId"), { status: 400 });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant || tenant.industry !== "cafe") {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Not found or not a cafe"), { status: 404 });
  }

  const result = await getMenuCategories(orgId);
  return NextResponse.json(apiSuccess(result));
}
