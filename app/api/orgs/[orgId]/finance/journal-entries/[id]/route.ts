import { NextResponse } from "next/server";
import { getTenantById, getJournalEntryById } from "@/lib/supabase/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  if (!orgId || !id) return NextResponse.json({ error: "Missing orgId or id" }, { status: 400 });

  const tenant = await getTenantById(orgId);
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entry = await getJournalEntryById(orgId, id);
  if (!entry) return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
  return NextResponse.json(entry);
}
