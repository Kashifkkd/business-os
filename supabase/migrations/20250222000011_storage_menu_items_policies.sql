-- RLS policies for menu-items bucket: tenant-scoped upload/read/delete
-- Bucket "menu-items" must exist (create in Dashboard or via config.toml for local dev)
-- Path format: {tenant_id}/{filename}

CREATE POLICY "Tenant members can upload menu item images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'menu-items'
    AND (storage.foldername(name))[1] IN (SELECT public.user_tenant_ids()::text)
  );

CREATE POLICY "Tenant members can read menu item images"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'menu-items'
    AND (storage.foldername(name))[1] IN (SELECT public.user_tenant_ids()::text)
  );

CREATE POLICY "Tenant members can update menu item images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'menu-items'
    AND (storage.foldername(name))[1] IN (SELECT public.user_tenant_ids()::text)
  );

CREATE POLICY "Tenant members can delete menu item images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'menu-items'
    AND (storage.foldername(name))[1] IN (SELECT public.user_tenant_ids()::text)
  );
