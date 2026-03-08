import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { JobTitle } from "@/lib/supabase/types";

/** GET a single job title. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId or id"), { status: 400 });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Org not found"), { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(apiError(API_ERROR_CODES.UNAUTHORIZED, "Unauthorized"), { status: 401 });
  }

  const { data: row, error } = await supabase
    .from("job_titles")
    .select("id, tenant_id, name, created_at, updated_at, created_by")
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (error || !row) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Job title not found"), { status: 404 });
  }

  return NextResponse.json(apiSuccess(row as JobTitle));
}

export type UpdateJobTitleBody = { name?: string };

/** PATCH update a job title. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId or id"), { status: 400 });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Org not found"), { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(apiError(API_ERROR_CODES.UNAUTHORIZED, "Unauthorized"), { status: 401 });
  }

  let body: UpdateJobTitleBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  if (name !== undefined && !name) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Job title name cannot be empty"), { status: 400 });
  }

  const payload: { name?: string } = {};
  if (name !== undefined) payload.name = name;

  if (Object.keys(payload).length === 0) {
    const { data: existing } = await supabase
      .from("job_titles")
      .select("id, tenant_id, name, created_at, updated_at, created_by")
      .eq("tenant_id", orgId)
      .eq("id", id)
      .single();
    if (!existing) {
      return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Job title not found"), { status: 404 });
    }
    return NextResponse.json(apiSuccess(existing as JobTitle));
  }

  const { data: row, error } = await supabase
    .from("job_titles")
    .update(payload)
    .eq("tenant_id", orgId)
    .eq("id", id)
    .select("id, tenant_id, name, created_at, updated_at, created_by")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "A job title with this name already exists"), { status: 400 });
    }
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess(row as JobTitle));
}

/** DELETE a job title. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId or id"), { status: 400 });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Org not found"), { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(apiError(API_ERROR_CODES.UNAUTHORIZED, "Unauthorized"), { status: 401 });
  }

  const { error } = await supabase
    .from("job_titles")
    .delete()
    .eq("tenant_id", orgId)
    .eq("id", id);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess({ deleted: true }));
}
