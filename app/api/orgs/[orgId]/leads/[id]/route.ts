import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import { createActivityLog, ACTIONS, ENTITY_TYPES } from "@/lib/activity-log";
import type { Lead } from "@/lib/supabase/types";

const LEAD_SELECT =
  "id, tenant_id, first_name, last_name, email, phone, company_id, source, stage_id, notes, metadata, created_at, updated_at, created_by";

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
    .from("leads")
    .select(LEAD_SELECT)
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (error || !row) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Lead not found"), { status: 404 });
  }

  const lead = row as Lead & { company_id?: string | null; created_by?: string | null; stage_id?: string; metadata?: Record<string, unknown> };
  const meta = (lead.metadata && typeof lead.metadata === "object" && !Array.isArray(lead.metadata) ? lead.metadata : {}) as Record<string, unknown>;
  const jobTitleId = typeof meta.job_title_id === "string" ? meta.job_title_id.trim() : "";
  const jobTitleName = typeof meta.job_title === "string" ? String(meta.job_title).trim() : "";
  const [stageRes, companyRes, jobTitleRes, sourceRes, assigneesRes] = await Promise.all([
    lead.stage_id
      ? supabase.from("lead_stages").select("id, name").eq("id", lead.stage_id).single()
      : Promise.resolve({ data: null }),
    lead.company_id
      ? supabase.from("companies").select("id, name").eq("id", lead.company_id).single()
      : Promise.resolve({ data: null }),
    jobTitleId
      ? supabase.from("job_titles").select("id, name").eq("id", jobTitleId).eq("tenant_id", orgId).maybeSingle()
      : jobTitleName
        ? supabase.from("job_titles").select("id, name").eq("tenant_id", orgId).eq("name", jobTitleName).maybeSingle()
        : Promise.resolve({ data: null }),
    lead.source
      ? supabase.from("lead_sources").select("id, name").eq("tenant_id", orgId).eq("name", lead.source).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("lead_assignees").select("user_id").eq("lead_id", id),
  ]);

  const assigneeIds = (assigneesRes.data ?? []).map((a: { user_id: string }) => a.user_id);
  const profileIds = [...new Set([...(lead.created_by ? [lead.created_by] : []), ...assigneeIds])];
  let assignees: { user_id: string; name: string | null; email: string | null }[] = [];
  let created_by_name: string | null = null;
  if (profileIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", profileIds);
    const name = (p: { first_name: string | null; last_name: string | null; email: string | null }) =>
      [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || p.email || null;
    if (lead.created_by && profiles?.length) {
      const creator = profiles.find((p: { id: string }) => p.id === lead.created_by);
      created_by_name = creator ? name(creator) : null;
    }
    assignees = (profiles ?? [])
      .filter((p: { id: string }) => assigneeIds.includes(p.id))
      .map((p: { id: string; first_name: string | null; last_name: string | null; email: string | null }) => ({
        user_id: p.id,
        name: name(p),
        email: p.email ?? null,
      }));
  }

  const metadataClean = { ...meta };
  delete metadataClean.job_title;
  delete metadataClean.job_title_id;
  const resolvedJobTitle = jobTitleRes.data
    ? { id: jobTitleRes.data.id, name: jobTitleRes.data.name ?? "" }
    : null;

  const result: Lead = {
    ...lead,
    source_id: sourceRes.data?.id ?? null,
    metadata: Object.keys(metadataClean).length > 0 ? metadataClean : undefined,
    stage: stageRes.data ? { id: stageRes.data.id, name: stageRes.data.name } : null,
    stage_name: stageRes.data?.name ?? null,
    company: companyRes.data ? { id: companyRes.data.id, name: companyRes.data.name } : null,
    company_name: companyRes.data?.name ?? null,
    job_title: resolvedJobTitle,
    created_by_name: created_by_name ?? undefined,
    assignee_ids: assigneeIds,
    assignees,
  };
  return NextResponse.json(apiSuccess(result));
}

export type UpdateLeadBody = Partial<{
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_id: string | null;
  source_id: string | null;
  stage_id: string;
  job_title_id: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  assignee_ids: string[];
}>;

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

  const { data: existing, error: fetchError } = await supabase
    .from("leads")
    .select(LEAD_SELECT)
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Lead not found"), { status: 404 });
  }

  let body: UpdateLeadBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.first_name === "string") {
    const firstTrim = body.first_name.trim();
    if (!firstTrim) {
      return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "First name is required"), { status: 400 });
    }
    payload.first_name = firstTrim;
  }
  if (body.last_name !== undefined) {
    payload.last_name = typeof body.last_name === "string" ? body.last_name.trim() : null;
  }
  if (body.email !== undefined) {
    payload.email = typeof body.email === "string" && body.email.trim() ? body.email.trim() : null;
  }
  if (body.phone !== undefined) {
    payload.phone = typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null;
  }
  if (body.company_id !== undefined) {
    payload.company_id = typeof body.company_id === "string" && body.company_id.trim() ? body.company_id.trim() : null;
  }
  if (body.source_id !== undefined) {
    const source_id = typeof body.source_id === "string" && body.source_id.trim() ? body.source_id.trim() : null;
    if (source_id) {
      const { data: sourceRow } = await supabase
        .from("lead_sources")
        .select("name")
        .eq("id", source_id)
        .eq("tenant_id", orgId)
        .maybeSingle();
      payload.source = sourceRow?.name ?? null;
    } else {
      payload.source = null;
    }
  }
  if (typeof body.stage_id === "string" && body.stage_id.trim()) {
    payload.stage_id = body.stage_id.trim();
  }
  if (body.notes !== undefined) {
    payload.notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;
  }
  if (body.job_title_id !== undefined) {
    const existingMeta = (payload.metadata ?? existing?.metadata) as Record<string, unknown> | undefined;
    const metadata = existingMeta && typeof existingMeta === "object" && !Array.isArray(existingMeta) ? { ...existingMeta } : {};
    delete metadata.job_title;
    const job_title_id = typeof body.job_title_id === "string" && body.job_title_id.trim() ? body.job_title_id.trim() : null;
    if (job_title_id) {
      metadata.job_title_id = job_title_id;
    } else {
      delete metadata.job_title_id;
    }
    payload.metadata = metadata;
  }
  if (body.metadata !== undefined && typeof body.metadata === "object" && !Array.isArray(body.metadata)) {
    const merged = { ...(payload.metadata as Record<string, unknown> ?? {}), ...body.metadata };
    delete merged.job_title;
    payload.metadata = merged;
  }

  const assignee_ids = body.assignee_ids !== undefined && Array.isArray(body.assignee_ids)
    ? (body.assignee_ids as string[]).filter((uid) => typeof uid === "string" && uid.trim())
    : undefined;

  if (assignee_ids !== undefined) {
    await supabase.from("lead_assignees").delete().eq("lead_id", id);
    if (assignee_ids.length > 0) {
      await supabase.from("lead_assignees").insert(
        assignee_ids.map((user_id) => ({ lead_id: id, user_id, tenant_id: orgId }))
      );
    }
  }

  if (Object.keys(payload).length === 0 && assignee_ids === undefined) {
    return NextResponse.json(apiSuccess(existing as Lead));
  }

  const { data: updated, error } = await supabase
    .from("leads")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", orgId)
    .select(LEAD_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const lead = updated as Lead;
  await createActivityLog(supabase, {
    tenantId: orgId,
    userId: user.id,
    action: ACTIONS.UPDATE,
    resourceType: ENTITY_TYPES.LEAD,
    resourceId: lead.id,
    description: `Updated lead "${[lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Lead"}"`,
    metadata: {},
  });

  return NextResponse.json(apiSuccess(lead));
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

  const { data: existing, error: fetchError } = await supabase
    .from("leads")
    .select("id, first_name, last_name")
    .eq("tenant_id", orgId)
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Lead not found"), { status: 404 });
  }

  const { error } = await supabase.from("leads").delete().eq("id", id).eq("tenant_id", orgId);

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const leadName = existing
    ? [existing.first_name, existing.last_name].filter(Boolean).join(" ").trim() || "Lead"
    : "Lead";
  await createActivityLog(supabase, {
    tenantId: orgId,
    userId: user.id,
    action: ACTIONS.DELETE,
    resourceType: ENTITY_TYPES.LEAD,
    resourceId: id,
    description: `Deleted lead "${leadName}"`,
    metadata: {},
  });

  return NextResponse.json(apiSuccess({ deleted: true }));
}
