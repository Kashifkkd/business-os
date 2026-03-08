import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import type { JobTitle } from "@/lib/supabase/types";

/** GET list of job titles for the org. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId"), { status: 400 });
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

  const { data: rows, error } = await supabase
    .from("job_titles")
    .select("id, tenant_id, name, created_at, updated_at, created_by")
    .eq("tenant_id", orgId)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const list = rows ?? [];
  const creatorIds = [...new Set(list.map((r: { created_by?: string | null }) => r.created_by).filter(Boolean))] as string[];
  const { data: profilesData } =
    creatorIds.length > 0
      ? await supabase.from("profiles").select("id, first_name, last_name, email, avatar_url").in("id", creatorIds)
      : { data: [] };
  const profileMap = new Map(
    (profilesData ?? []).map((p: { id: string; first_name: string | null; last_name: string | null; email: string | null; avatar_url?: string | null }) => [
      p.id,
      {
        name: [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || p.email || null,
        avatar_url: p.avatar_url ?? null,
      },
    ])
  );

  const { data: leadMetas } = await supabase.from("leads").select("metadata").eq("tenant_id", orgId);
  const countByJobTitleName: Record<string, number> = {};
  (leadMetas ?? []).forEach((r: { metadata?: { job_title?: string } | null }) => {
    const jt = typeof r.metadata?.job_title === "string" ? r.metadata.job_title.trim() : "";
    if (jt) countByJobTitleName[jt] = (countByJobTitleName[jt] ?? 0) + 1;
  });

  const items: JobTitle[] = list.map((r: { id: string; tenant_id: string; name: string; created_at: string; updated_at: string; created_by?: string | null }) => {
    const creator = r.created_by ? profileMap.get(r.created_by) : null;
    return {
      id: r.id,
      tenant_id: r.tenant_id,
      name: r.name,
      created_at: r.created_at,
      updated_at: r.updated_at,
      created_by: r.created_by ?? null,
      created_by_name: creator?.name ?? null,
      created_by_avatar_url: creator?.avatar_url ?? null,
      lead_count: countByJobTitleName[r.name] ?? 0,
    };
  });

  return NextResponse.json(apiSuccess<JobTitle[]>(items));
}

export type CreateJobTitleBody = { name: string };

/** POST create a job title. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Missing orgId"), { status: 400 });
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

  let body: CreateJobTitleBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "Job title name is required"), { status: 400 });
  }

  const { data: row, error } = await supabase
    .from("job_titles")
    .insert({ tenant_id: orgId, name, created_by: user.id })
    .select("id, tenant_id, name, created_at, updated_at, created_by")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "A job title with this name already exists"), { status: 400 });
    }
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  return NextResponse.json(apiSuccess(row as JobTitle), { status: 201 });
}
