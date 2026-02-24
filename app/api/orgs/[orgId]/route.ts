import { IndustryType } from './../../../../lib/supabase/types';
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantById } from "@/lib/supabase/queries";

/**
 * Single organization (tenant) by id. Contains name, industry, logo_url, role.
 * All org details live in the tenants table (tenant = organization in this app).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }
  const org = await getTenantById(orgId);
  if (!org) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(org);
}

type OrgUpdateBody = {
  name?: string;
  industry?: "cafe" | "real_estate";
  logo_url?: string | null;
  timezone?: string;
  date_format?: string;
  time_format?: string;
  currency?: string;
  currency_symbol?: string;
  number_format?: string;
  language?: string;
  country?: string;
  locale?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: member } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", orgId)
    .eq("user_id", user.id)
    .single();
  if (!member) {
    return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
  }

  let body: OrgUpdateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload: Record<string, string | null> = {};
  if (body.name !== undefined) payload.name = body.name;
  if (body.industry !== undefined) payload.industry = body.industry;
  if (body.logo_url !== undefined) payload.logo_url = body.logo_url ?? null;
  if (body.timezone !== undefined) payload.timezone = body.timezone;
  if (body.date_format !== undefined) payload.date_format = body.date_format;
  if (body.time_format !== undefined) payload.time_format = body.time_format;
  if (body.currency !== undefined) payload.currency = body.currency;
  if (body.currency_symbol !== undefined) payload.currency_symbol = body.currency_symbol;
  if (body.number_format !== undefined) payload.number_format = body.number_format;
  if (body.language !== undefined) payload.language = body.language;
  if (body.country !== undefined) payload.country = body.country;
  if (body.locale !== undefined) payload.locale = body.locale;

  if (Object.keys(payload).length === 0) {
    const org = await getTenantById(orgId);
    return org ? NextResponse.json(org) : NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabase.from("tenants").update(payload).eq("id", orgId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const org = await getTenantById(orgId);
  return NextResponse.json(org!);
}
