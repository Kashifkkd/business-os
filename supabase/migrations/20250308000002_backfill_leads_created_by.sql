-- Backfill: set created_by to tenant owner (or first member) for existing leads with null created_by.
UPDATE public.leads l
SET created_by = sub.user_id
FROM (
  SELECT DISTINCT ON (tm.tenant_id) tm.tenant_id, tm.user_id
  FROM public.tenant_members tm
  ORDER BY tm.tenant_id,
    CASE tm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
    tm.created_at ASC
) sub
WHERE l.tenant_id = sub.tenant_id AND l.created_by IS NULL;
