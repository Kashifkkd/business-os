import { NextResponse } from "next/server";
import { getTenantMembers } from "@/lib/supabase/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }
  const members = await getTenantMembers(orgId);
  return NextResponse.json(members);
}
