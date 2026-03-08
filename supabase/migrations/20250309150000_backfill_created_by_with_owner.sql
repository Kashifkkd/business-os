-- Backfill created_by with tenant owner (or first member by role) for existing rows where created_by IS NULL.
-- Uses same logic as backfill_leads_created_by: prefer owner, then admin, then earliest member.

WITH tenant_owner AS (
  SELECT DISTINCT ON (tm.tenant_id) tm.tenant_id, tm.user_id
  FROM public.tenant_members tm
  ORDER BY tm.tenant_id,
    CASE tm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
    tm.created_at ASC
)
UPDATE public.companies c
SET created_by = o.user_id
FROM tenant_owner o
WHERE c.tenant_id = o.tenant_id AND c.created_by IS NULL;

WITH tenant_owner AS (
  SELECT DISTINCT ON (tm.tenant_id) tm.tenant_id, tm.user_id
  FROM public.tenant_members tm
  ORDER BY tm.tenant_id,
    CASE tm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
    tm.created_at ASC
)
UPDATE public.job_titles j
SET created_by = o.user_id
FROM tenant_owner o
WHERE j.tenant_id = o.tenant_id AND j.created_by IS NULL;

WITH tenant_owner AS (
  SELECT DISTINCT ON (tm.tenant_id) tm.tenant_id, tm.user_id
  FROM public.tenant_members tm
  ORDER BY tm.tenant_id,
    CASE tm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
    tm.created_at ASC
)
UPDATE public.lead_stages ls
SET created_by = o.user_id
FROM tenant_owner o
WHERE ls.tenant_id = o.tenant_id AND ls.created_by IS NULL;

WITH tenant_owner AS (
  SELECT DISTINCT ON (tm.tenant_id) tm.tenant_id, tm.user_id
  FROM public.tenant_members tm
  ORDER BY tm.tenant_id,
    CASE tm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
    tm.created_at ASC
)
UPDATE public.lead_sources lsrc
SET created_by = o.user_id
FROM tenant_owner o
WHERE lsrc.tenant_id = o.tenant_id AND lsrc.created_by IS NULL;
