import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_ERROR_CODES } from "@/lib/api-response";
import { getTenantById } from "@/lib/supabase/queries";
import { createActivityLog, ACTIONS, ENTITY_TYPES } from "@/lib/activity-log";
import type { Lead } from "@/lib/supabase/types";

const LEAD_SELECT =
  "id, tenant_id, first_name, last_name, email, phone, company_id, source, stage_id, notes, metadata, created_at, updated_at, created_by";

export interface GetLeadsResult {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
}

const SORT_COLUMNS = ["created_at", "name", "last_name", "first_name", "stage_id"] as const;
type SortColumn = (typeof SORT_COLUMNS)[number];

function toSortColumn(sortBy: string): "created_at" | "last_name" | "first_name" | "stage_id" {
  if (sortBy === "name") return "last_name";
  if (["last_name", "first_name", "stage_id", "created_at"].includes(sortBy)) return sortBy as "last_name" | "first_name" | "stage_id" | "created_at";
  return "created_at";
}

/** GET list of leads. Query: page, pageSize, search, stage (stage_id), source, created_after, created_before, sortBy, order */
export async function GET(
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

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 10));
  const search = (searchParams.get("search") ?? "").trim() || undefined;
  const stage = (searchParams.get("stage") ?? "").trim() || undefined;
  const source = (searchParams.get("source") ?? "").trim() || undefined;
  const createdAfter = (searchParams.get("created_after") ?? "").trim() || undefined;
  const createdBefore = (searchParams.get("created_before") ?? "").trim() || undefined;
  const sortByRaw = (searchParams.get("sortBy") ?? "created_at").trim();
  const sortByParam = SORT_COLUMNS.includes(sortByRaw as SortColumn) ? sortByRaw : "created_at";
  const sortBy = toSortColumn(sortByParam);
  const order = (searchParams.get("order") ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(apiError(API_ERROR_CODES.UNAUTHORIZED, "Unauthorized"), { status: 401 });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("leads")
    .select(LEAD_SELECT, { count: "exact" })
    .eq("tenant_id", orgId)
    .order(sortBy, { ascending: order === "asc" })
    .range(from, to);

  if (search) {
    const term = `%${search}%`;
    query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`);
  }
  if (stage) {
    query = query.eq("stage_id", stage);
  }
  if (source) {
    query = query.eq("source", source);
  }
  if (createdAfter) {
    const fromDate = createdAfter.includes("T") ? createdAfter : `${createdAfter}T00:00:00.000Z`;
    query = query.gte("created_at", fromDate);
  }
  if (createdBefore) {
    const toDate = createdBefore.includes("T") ? createdBefore : `${createdBefore}T23:59:59.999Z`;
    query = query.lte("created_at", toDate);
  }

  const { data: rows, error, count } = await query;

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const list = (rows ?? []) as (Lead & { created_by?: string | null })[];
  const leadIds = list.map((r) => r.id);
  const stageIds = [...new Set(list.map((r) => r.stage_id).filter(Boolean))] as string[];
  const companyIds = [...new Set(list.map((r) => r.company_id).filter(Boolean))] as string[];
  const creatorIds = [...new Set(list.map((r) => r.created_by).filter(Boolean))] as string[];

  const [stagesRes, companiesRes, jobTitlesRes, sourcesRes, assigneesRes] = await Promise.all([
    stageIds.length > 0
      ? supabase.from("lead_stages").select("id, name").in("id", stageIds)
      : Promise.resolve({ data: [] }),
    companyIds.length > 0
      ? supabase.from("companies").select("id, name").in("id", companyIds)
      : Promise.resolve({ data: [] }),
    supabase.from("job_titles").select("id, name").eq("tenant_id", orgId),
    supabase.from("lead_sources").select("id, name").eq("tenant_id", orgId),
    leadIds.length > 0
      ? supabase.from("lead_assignees").select("lead_id, user_id").in("lead_id", leadIds)
      : Promise.resolve({ data: [] }),
  ]);

  const assigneeUserIds = [...new Set((assigneesRes.data ?? []).map((a: { user_id: string }) => a.user_id))];
  const profileIds = [...new Set([...creatorIds, ...assigneeUserIds])];
  const { data: profilesData } =
    profileIds.length > 0
      ? await supabase.from("profiles").select("id, first_name, last_name, email").in("id", profileIds)
      : { data: [] };

  const stageById: Record<string, { id: string; name: string }> = {};
  (stagesRes.data ?? []).forEach((s: { id: string; name: string }) => {
    stageById[s.id] = { id: s.id, name: s.name };
  });
  const companyById: Record<string, { id: string; name: string }> = {};
  (companiesRes.data ?? []).forEach((c: { id: string; name: string }) => {
    companyById[c.id] = { id: c.id, name: c.name };
  });
  const jobTitleByName: Record<string, { id: string; name: string }> = {};
  const jobTitleById: Record<string, { id: string; name: string }> = {};
  (jobTitlesRes.data ?? []).forEach((j: { id: string; name: string }) => {
    const name = String(j.name ?? "").trim();
    if (name) jobTitleByName[name] = { id: j.id, name };
    jobTitleById[j.id] = { id: j.id, name: j.name ?? "" };
  });
  const sourceNameToId: Record<string, string> = {};
  (sourcesRes.data ?? []).forEach((s: { id: string; name: string }) => {
    const name = String(s.name ?? "").trim();
    if (name) sourceNameToId[name] = s.id;
  });
  const assigneesByLead: Record<string, string[]> = {};
  (assigneesRes.data ?? []).forEach((a: { lead_id: string; user_id: string }) => {
    if (!assigneesByLead[a.lead_id]) assigneesByLead[a.lead_id] = [];
    assigneesByLead[a.lead_id].push(a.user_id);
  });
  const profileMap = new Map(
    (profilesData ?? []).map((p: { id: string; first_name: string | null; last_name: string | null; email: string | null }) => [
      p.id,
      {
        name: [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || p.email || null,
        email: p.email ?? null,
      },
    ])
  );
  const creatorNames: Record<string, string> = {};
  creatorIds.forEach((id) => {
    const p = profileMap.get(id);
    creatorNames[id] = p?.name ?? id;
  });

  const items: Lead[] = list.map((r) => {
    const meta = (r.metadata && typeof r.metadata === "object" && !Array.isArray(r.metadata) ? r.metadata : {}) as Record<string, unknown>;
    const jobTitleId = typeof meta.job_title_id === "string" ? meta.job_title_id.trim() : "";
    const jobTitleName = typeof meta.job_title === "string" ? meta.job_title.trim() : "";
    const metadataClean = { ...meta };
    delete metadataClean.job_title;
    delete metadataClean.job_title_id;
    const resolvedJobTitle =
      jobTitleId && jobTitleById[jobTitleId]
        ? jobTitleById[jobTitleId]
        : jobTitleName && jobTitleByName[jobTitleName]
          ? jobTitleByName[jobTitleName]
          : null;
    return {
      ...r,
      source_id: r.source ? sourceNameToId[r.source] ?? null : null,
      metadata: Object.keys(metadataClean).length > 0 ? metadataClean : undefined,
      stage: r.stage_id ? stageById[r.stage_id] ?? null : null,
      stage_name: r.stage_id ? stageById[r.stage_id]?.name ?? null : null,
      company: r.company_id ? companyById[r.company_id] ?? null : null,
      company_name: r.company_id ? companyById[r.company_id]?.name ?? null : null,
      job_title: resolvedJobTitle,
      created_by_name: r.created_by ? creatorNames[r.created_by] ?? null : null,
      assignee_ids: assigneesByLead[r.id] ?? [],
      assignees: (assigneesByLead[r.id] ?? []).map((uid) => {
        const p = profileMap.get(uid);
        return { user_id: uid, name: p?.name ?? null, email: p?.email ?? null };
      }),
    };
  });
  const total = count ?? 0;
  return NextResponse.json(apiSuccess<GetLeadsResult>({ items, total, page, pageSize }, total));
}

export type CreateLeadBody = {
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company_id?: string | null;
  source_id?: string | null;
  stage_id?: string | null;
  job_title_id?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  assignee_ids?: string[];
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

  let body: CreateLeadBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, "Invalid JSON"), { status: 400 });
  }

  const first_name = typeof body.first_name === "string" ? body.first_name.trim() : "";
  if (!first_name) {
    return NextResponse.json(apiError(API_ERROR_CODES.VALIDATION_ERROR, "First name is required"), { status: 400 });
  }
  const last_name = typeof body.last_name === "string" ? body.last_name.trim() : "";

  const company_id =
    typeof body.company_id === "string" && body.company_id.trim() ? body.company_id.trim() : null;
  const assignee_ids = Array.isArray(body.assignee_ids)
    ? (body.assignee_ids as string[]).filter((id) => typeof id === "string" && id.trim())
    : [];

  let source: string | null = null;
  const source_id = typeof body.source_id === "string" && body.source_id.trim() ? body.source_id.trim() : null;
  if (source_id) {
    const { data: sourceRow } = await supabase
      .from("lead_sources")
      .select("name")
      .eq("id", source_id)
      .eq("tenant_id", orgId)
      .maybeSingle();
    source = sourceRow?.name ?? null;
  }

  const job_title_id = typeof body.job_title_id === "string" && body.job_title_id.trim() ? body.job_title_id.trim() : null;
  const metadata: Record<string, unknown> =
    body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? { ...body.metadata }
      : {};
  delete metadata.job_title;
  if (job_title_id) {
    metadata.job_title_id = job_title_id;
  }

  let stage_id: string | null =
    typeof body.stage_id === "string" && body.stage_id.trim() ? body.stage_id.trim() : null;
  if (!stage_id) {
    const { data: defaultStage } = await supabase
      .from("lead_stages")
      .select("id")
      .eq("tenant_id", orgId)
      .eq("is_default", true)
      .limit(1)
      .maybeSingle();
    stage_id = defaultStage?.id ?? null;
  }
  if (!stage_id) {
    const { data: firstStage } = await supabase
      .from("lead_stages")
      .select("id")
      .eq("tenant_id", orgId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    stage_id = firstStage?.id ?? null;
  }
  if (!stage_id) {
    return NextResponse.json(
      apiError(API_ERROR_CODES.VALIDATION_ERROR, "No lead stages configured. Add stages in Leads → Stages."),
      { status: 400 }
    );
  }

  const insert: Record<string, unknown> = {
    tenant_id: orgId,
    first_name,
    last_name,
    email: typeof body.email === "string" && body.email.trim() ? body.email.trim() : null,
    phone: typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null,
    company_id: company_id || null,
    source,
    stage_id,
    notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
    metadata: Object.keys(metadata).length > 0 ? metadata : {},
    created_by: user.id,
  };

  const { data: row, error } = await supabase
    .from("leads")
    .insert(insert)
    .select(LEAD_SELECT)
    .single();

  if (error) {
    return NextResponse.json(apiError(API_ERROR_CODES.BAD_REQUEST, error.message), { status: 400 });
  }

  const lead = row as Lead;

  if (assignee_ids.length > 0) {
    await supabase.from("lead_assignees").insert(
      assignee_ids.map((user_id) => ({
        lead_id: lead.id,
        user_id,
        tenant_id: orgId,
      }))
    );
  }
  await createActivityLog(supabase, {
    tenantId: orgId,
    userId: user.id,
    action: ACTIONS.CREATE,
    resourceType: ENTITY_TYPES.LEAD,
    resourceId: lead.id,
    description: `Created lead "${[lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Lead"}"`,
    metadata: {},
  });

  return NextResponse.json(apiSuccess(lead), { status: 201 });
}
