-- Ensure the "menu-items" storage bucket exists (for local dev / self-hosted).
-- For Supabase Hosted: if you get "bucket not found", create the bucket in Dashboard:
--   Storage → New bucket → Name: menu-items, Public: ON, File size limit: 5MB,
--   Allowed MIME types: image/jpeg, image/png, image/webp
-- RLS policies are in 20250222000011_storage_menu_items_policies.sql (path: {tenant_id}/...).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'menu-items') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'menu-items',
      'menu-items',
      true,
      5242880,
      ARRAY['image/jpeg', 'image/png', 'image/webp']
    );
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN OTHERS THEN NULL;
END $$;
