-- Remove activity_tasks table. Activities module now only has calls and meetings.
-- CRM tasks can be modeled via the Tasks module (project tasks) with lead/deal links in future.

DROP TABLE IF EXISTS public.activity_tasks;
