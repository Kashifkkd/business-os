import { NextResponse } from "next/server";
import { getTenantById, getInventoryAnalytics } from "@/lib/supabase/queries";

/** GET inventory analytics for dashboard */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }

  const tenant = await getTenantById(orgId);
  if (!tenant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const analytics = await getInventoryAnalytics(orgId);
  return NextResponse.json(analytics);
}
