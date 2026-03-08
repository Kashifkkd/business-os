-- Ensure the "avatars" storage bucket exists (profile images).
-- RLS policies are in 20250222130000_profiles_avatar_path.sql (path: {user_id}/...).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'avatars',
      'avatars',
      true,
      2097152,
      ARRAY['image/jpeg', 'image/png', 'image/webp']
    );
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN OTHERS THEN NULL;
END $$;
