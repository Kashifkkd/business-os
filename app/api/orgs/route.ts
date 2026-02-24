import { NextResponse } from "next/server";
import { getUserTenants } from "@/lib/supabase/queries";

/**
 * Organizations = tenants the current user belongs to (via tenant_members).
 * All org details (name, industry, logo_url) are stored in the tenants table.
 * Returns [] if the user has no memberships (e.g. before creating or joining an org).
 */
export async function GET() {
  const orgs = await getUserTenants();
  return NextResponse.json(orgs);
}
