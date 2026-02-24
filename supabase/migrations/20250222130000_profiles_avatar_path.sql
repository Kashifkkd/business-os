-- Store profile image as storage path; app resolves to public URL when returning profile.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_path TEXT;

COMMENT ON COLUMN public.profiles.avatar_path IS 'Storage path for profile image (e.g. in avatars bucket). Resolved to avatar_url in API.';

-- Bucket "avatars" must exist (create in Dashboard or add to config.toml for local).
-- Path format: {user_id}/avatar.{ext} so RLS can restrict by folder.

-- RLS: users can only read/upload/update/delete their own avatar (path = {user_id}/...)
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read own avatar"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
