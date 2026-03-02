import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { MarketingTemplate } from "@/lib/supabase/types";

const TEMPLATE_SELECT =
  "id, tenant_id, name, description, channel, subject, body, variables, is_active, created_at, updated_at";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing params"), {
      status: 400,
    });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Org not found"), {
      status: 404,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(apiError(API_ERROR_CODES.UNAUTHORIZED, "Unauthorized"), {
      status: 401,
    });
  }

  const { data: row, error } = await supabase
    .from("marketing_templates")
    .select(TEMPLATE_SELECT)
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Template not found"), {
      status: 404,
    });
  }

  return NextResponse.json(apiSuccess(row as MarketingTemplate));
}
