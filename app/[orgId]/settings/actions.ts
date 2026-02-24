"use server";

import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  success: boolean;
  error?: string;
}

/** Update organization (tenant) basic info. Caller must be a member. */
export async function updateOrganization(
  organizationId: string,
  data: { name?: string; industry?: "cafe" | "real_estate" }
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: member } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", organizationId)
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return { success: false, error: "Not a member of this organization" };
  }

  const payload: Record<string, string> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.industry !== undefined) payload.industry = data.industry;
  if (Object.keys(payload).length === 0) {
    return { success: true };
  }

  const { error } = await supabase
    .from("tenants")
    .update(payload)
    .eq("id", organizationId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/** Editable profile fields (name). Phone is updated via auth OTP in the client. Email is read-only. */
export type ProfileUpdate = {
  first_name?: string | null;
  last_name?: string | null;
};

/** Update current user's profile (auth user_metadata; syncs to profiles for member list). */
export async function updateProfile(
  data: ProfileUpdate,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const metadata: Record<string, string | null> = {};
  if (data.first_name !== undefined) metadata.first_name = data.first_name ?? null;
  if (data.last_name !== undefined) metadata.last_name = data.last_name ?? null;
  if (Object.keys(metadata).length === 0) {
    return { success: true };
  }

  const { error } = await supabase.auth.updateUser({ data: metadata });
  if (error) {
    return { success: false, error: error.message };
  }

  const profilePayload: Record<string, unknown> = { id: user.id, ...metadata };
  await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" });

  return { success: true };
}

const AVATAR_BUCKET = "avatars";
const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2MiB
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Upload profile image. Stores public URL in auth user_metadata.avatar_url (and syncs to profiles for member list). */
export async function uploadProfileImage(
  formData: FormData,
): Promise<ActionResult & { url?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return { success: false, error: "No file provided" };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { success: false, error: "Image must be 2MB or less" };
  }
  if (!AVATAR_TYPES.includes(file.type)) {
    return { success: false, error: "Only JPEG, PNG, and WebP are allowed" };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
  if (updateError) {
    return { success: false, error: updateError.message };
  }

  await supabase.from("profiles").upsert(
    { id: user.id, avatar_url: publicUrl },
    { onConflict: "id" }
  );

  return { success: true, url: publicUrl };
}

/** Remove profile image (clears avatar_url in auth and profiles). */
export async function removeProfileImage(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: null } });
  if (updateError) {
    return { success: false, error: updateError.message };
  }

  await supabase.from("profiles").upsert(
    { id: user.id, avatar_url: null },
    { onConflict: "id" }
  );

  return { success: true };
}
