-- RLS policies for property-images bucket: tenant-scoped upload/read/update/delete
-- Bucket "property-images" must exist (create in Dashboard or via config.toml for local dev)
-- Path format: {org_id}/{uuid}-{filename}

CREATE POLICY "Tenant members can upload property images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] IN (SELECT public.user_tenant_ids()::text)
  );

CREATE POLICY "Tenant members can read property images"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] IN (SELECT public.user_tenant_ids()::text)
  );

CREATE POLICY "Tenant members can update property images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] IN (SELECT public.user_tenant_ids()::text)
  );

CREATE POLICY "Tenant members can delete property images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] IN (SELECT public.user_tenant_ids()::text)
  );
