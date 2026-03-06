-- Ensure the "property-images" storage bucket exists (for local dev / self-hosted).
-- For Supabase Hosted: if you get "bucket not found", create the bucket in Dashboard:
--   Storage → New bucket → Name: property-images, Public: ON, File size limit: 5MB,
--   Allowed MIME types: image/jpeg, image/png, image/webp
-- RLS policies are in 20250306100001_storage_property_images_policies.sql (path: {org_id}/...).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'property-images') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'property-images',
      'property-images',
      true,
      5242880,
      ARRAY['image/jpeg', 'image/png', 'image/webp']
    );
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN OTHERS THEN NULL;
END $$;
