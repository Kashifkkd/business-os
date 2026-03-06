-- RLS policies for lead-notes bucket: tenant-scoped upload/read/update/delete
-- Path format: {org_id}/{lead_id}/{uuid}-{filename}

CREATE POLICY "Tenant members can upload lead note attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'lead-notes'
    AND (storage.foldername(name))[1] IN (SELECT public.user_tenant_ids()::text)
  );

CREATE POLICY "Tenant members can read lead note attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'lead-notes'
    AND (storage.foldername(name))[1] IN (SELECT public.user_tenant_ids()::text)
  );

CREATE POLICY "Tenant members can update lead note attachments"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'lead-notes'
    AND (storage.foldername(name))[1] IN (SELECT public.user_tenant_ids()::text)
  );

CREATE POLICY "Tenant members can delete lead note attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'lead-notes'
    AND (storage.foldername(name))[1] IN (SELECT public.user_tenant_ids()::text)
  );
