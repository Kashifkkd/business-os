import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";
import type { User } from "@supabase/supabase-js";

/** Build Profile response from auth user (source of truth for current user). */
function userToProfile(user: User): Profile {
  const m = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? null,
    first_name: (m.first_name as string) ?? null,
    last_name: (m.last_name as string) ?? null,
    avatar_url: (m.avatar_url as string) ?? null,
    phone: user.phone ?? (m.phone as string) ?? null,
    created_at: user.created_at ?? new Date().toISOString(),
    updated_at: user.updated_at ?? new Date().toISOString(),
  };
}

/** Sync current auth user into profiles table so member lists can show name/email/phone. */
async function syncAuthUserToProfiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: User
) {
  const m = user.user_metadata ?? {};
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      first_name: (m.first_name as string) ?? null,
      last_name: (m.last_name as string) ?? null,
      avatar_url: (m.avatar_url as string) ?? null,
      phone: user.phone ?? (m.phone as string) ?? null,
    },
    { onConflict: "id" }
  );
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Not signed in. Sign in to access your profile." },
      { status: 401 }
    );
  }

  // Ensure profiles row exists for member lists (other orgs showing this user's name)
  await syncAuthUserToProfiles(supabase, user);

  return NextResponse.json(userToProfile(user));
}

type ProfileUpdateBody = Partial<
  Pick<Profile, "first_name" | "last_name" | "avatar_url">
>;

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ProfileUpdateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, string | null> = {};
  if (body.first_name !== undefined) data.first_name = body.first_name ?? null;
  if (body.last_name !== undefined) data.last_name = body.last_name ?? null;
  if (body.avatar_url !== undefined) data.avatar_url = body.avatar_url ?? null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json(userToProfile(user));
  }

  const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({ data });
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  const updated = updatedUser?.user ?? user;
  await syncAuthUserToProfiles(supabase, updated);

  return NextResponse.json(userToProfile(updated));
}
