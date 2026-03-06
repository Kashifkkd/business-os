-- Lead note attachments bucket (cross-industry).
-- Path format: {org_id}/{lead_id}/{uuid}-{filename}
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'lead-notes') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'lead-notes',
      'lead-notes',
      true,
      10485760,
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']
    );
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN OTHERS THEN NULL;
END $$;
