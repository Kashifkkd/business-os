"use server";

import { createClient } from "@/lib/supabase/server";
import { getTenantById } from "@/lib/supabase/queries";

const BUCKET = "menu-items";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MiB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type UploadResult = { url: string } | { error: string };

/**
 * Upload a menu item image to Supabase Storage and return the public URL.
 * Files are stored under org-scoped paths: {orgId}/{uuid}-{filename} so each org's files are separate.
 * Caller must be a member of the tenant.
 * If you see "bucket not found": create bucket "menu-items" in Supabase Dashboard (Storage → New bucket):
 *   Public: ON, File size limit: 5MB, Allowed MIME: image/jpeg, image/png, image/webp.
 */
export async function uploadMenuItemImage(
  orgId: string,
  formData: FormData
): Promise<UploadResult> {
  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return { error: "No file provided" };
  }

  const tenant = await getTenantById(orgId);
  if (!tenant || tenant.industry !== "cafe") {
    return { error: "Tenant not found or not a cafe" };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return { error: "File must be 5MB or less" };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Only JPEG, PNG, and WebP images are allowed" };
  }

  const supabase = await createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 80);
  const path = `${orgId}/${crypto.randomUUID()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    const msg =
      error.message?.toLowerCase().includes("bucket") || error.message?.toLowerCase().includes("not found")
        ? `Storage bucket "${BUCKET}" not found. Create it in Supabase Dashboard: Storage → New bucket → name "${BUCKET}", Public ON, 5MB limit, MIME image/jpeg, image/png, image/webp.`
        : error.message;
    return { error: msg };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return { url: publicUrl };
}

const PROPERTY_BUCKET = "property-images";

/**
 * Upload a property image to Supabase Storage. Path: {orgId}/{uuid}-{filename}.
 * Bucket is created by migration 20250306100000_storage_property_images_bucket.sql
 * (or create in Dashboard: Public ON, 5MB limit, MIME image/jpeg, image/png, image/webp).
 */
export async function uploadPropertyImage(
  orgId: string,
  formData: FormData
): Promise<UploadResult> {
  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return { error: "No file provided" };
  }

  const tenant = await getTenantById(orgId);
  if (!tenant || tenant.industry !== "real_estate") {
    return { error: "Tenant not found or not a real estate org" };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return { error: "File must be 5MB or less" };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Only JPEG, PNG, and WebP images are allowed" };
  }

  const supabase = await createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 80);
  const path = `${orgId}/${crypto.randomUUID()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(PROPERTY_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    const msg =
      error.message?.toLowerCase().includes("bucket") || error.message?.toLowerCase().includes("not found")
        ? `Storage bucket "${PROPERTY_BUCKET}" not found. Create it in Supabase Dashboard: Storage → New bucket → name "${PROPERTY_BUCKET}", Public ON, 5MB limit, MIME image/jpeg, image/png, image/webp.`
        : error.message;
    return { error: msg };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROPERTY_BUCKET).getPublicUrl(data.path);
  return { url: publicUrl };
}

const LEAD_NOTES_BUCKET = "lead-notes";
const LEAD_NOTES_MAX_BYTES = 10 * 1024 * 1024; // 10MiB
const LEAD_NOTES_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
];

/**
 * Upload a lead note attachment. Path: {orgId}/{leadId}/{uuid}-{filename}.
 * Cross-industry; no industry check.
 */
export async function uploadLeadNoteAttachment(
  orgId: string,
  leadId: string,
  formData: FormData
): Promise<UploadResult> {
  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return { error: "No file provided" };
  }

  const tenant = await getTenantById(orgId);
  if (!tenant) {
    return { error: "Tenant not found" };
  }

  if (file.size > LEAD_NOTES_MAX_BYTES) {
    return { error: "File must be 10MB or less" };
  }
  if (!LEAD_NOTES_ALLOWED_TYPES.includes(file.type)) {
    return { error: "Only JPEG, PNG, WebP, PDF, and plain text files are allowed" };
  }

  const supabase = await createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 80);
  const path = `${orgId}/${leadId}/${crypto.randomUUID()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(LEAD_NOTES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    const msg =
      error.message?.toLowerCase().includes("bucket") || error.message?.toLowerCase().includes("not found")
        ? `Storage bucket "${LEAD_NOTES_BUCKET}" not found. Create it in Supabase Dashboard.`
        : error.message;
    return { error: msg };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(LEAD_NOTES_BUCKET).getPublicUrl(data.path);
  return { url: publicUrl };
}
