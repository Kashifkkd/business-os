-- Tasks module: spaces, lists, statuses, tasks, assignees, comments, activity (blueprint-aligned)
-- Organization = tenant; all scoped by tenant_id. Space = project; List = grouping inside space.

-- Spaces (projects) — org-scoped
CREATE TABLE public.task_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_spaces_tenant_id ON public.task_spaces(tenant_id);
CREATE TRIGGER task_spaces_updated_at
  BEFORE UPDATE ON public.task_spaces
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.task_spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can manage task_spaces"
  ON public.task_spaces FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Lists (groupings inside a space, e.g. Backlog, Sprint 1)
CREATE TABLE public.task_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.task_spaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_lists_space_id ON public.task_lists(space_id);
CREATE TRIGGER task_lists_updated_at
  BEFORE UPDATE ON public.task_lists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.task_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can manage task_lists"
  ON public.task_lists FOR ALL
  USING (
    space_id IN (SELECT id FROM public.task_spaces WHERE tenant_id IN (SELECT public.user_tenant_ids()))
  );

-- Statuses: org default (space_id NULL) or space-specific
CREATE TABLE public.task_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  space_id UUID REFERENCES public.task_spaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'todo' CHECK (type IN ('todo', 'in_progress', 'done')),
  sort_order INT NOT NULL DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_statuses_tenant_id ON public.task_statuses(tenant_id);
CREATE INDEX idx_task_statuses_space_id ON public.task_statuses(space_id);
CREATE TRIGGER task_statuses_updated_at
  BEFORE UPDATE ON public.task_statuses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.task_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can manage task_statuses"
  ON public.task_statuses FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Labels (tags): org or space scoped
CREATE TABLE public.task_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  space_id UUID REFERENCES public.task_spaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_labels_tenant_id ON public.task_labels(tenant_id);
CREATE INDEX idx_task_labels_space_id ON public.task_labels(space_id);
CREATE TRIGGER task_labels_updated_at
  BEFORE UPDATE ON public.task_labels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can manage task_labels"
  ON public.task_labels FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Tasks: single entity with optional parent (subtasks/epics)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  space_id UUID NOT NULL REFERENCES public.task_spaces(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES public.task_lists(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  status_id UUID NOT NULL REFERENCES public.task_statuses(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'none' CHECK (priority IN ('urgent', 'high', 'medium', 'low', 'none')),
  due_date DATE,
  start_date DATE,
  sort_order INT NOT NULL DEFAULT 0,
  custom_fields JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_tenant_id ON public.tasks(tenant_id);
CREATE INDEX idx_tasks_space_id ON public.tasks(space_id);
CREATE INDEX idx_tasks_list_id ON public.tasks(list_id);
CREATE INDEX idx_tasks_parent_id ON public.tasks(parent_id);
CREATE INDEX idx_tasks_status_id ON public.tasks(status_id);
CREATE INDEX idx_tasks_space_status ON public.tasks(space_id, status_id);
CREATE INDEX idx_tasks_space_due_date ON public.tasks(space_id, due_date);
CREATE INDEX idx_tasks_list_sort ON public.tasks(list_id, sort_order);
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can manage tasks"
  ON public.tasks FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Task assignees (many-to-many)
CREATE TABLE public.task_assignees (
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, user_id)
);

CREATE INDEX idx_task_assignees_user_id ON public.task_assignees(user_id);
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can manage task_assignees"
  ON public.task_assignees FOR ALL
  USING (
    task_id IN (SELECT id FROM public.tasks WHERE tenant_id IN (SELECT public.user_tenant_ids()))
  );

-- Task <-> Labels (many-to-many)
CREATE TABLE public.task_task_labels (
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.task_labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, label_id)
);

CREATE INDEX idx_task_task_labels_label_id ON public.task_task_labels(label_id);
ALTER TABLE public.task_task_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can manage task_task_labels"
  ON public.task_task_labels FOR ALL
  USING (
    task_id IN (SELECT id FROM public.tasks WHERE tenant_id IN (SELECT public.user_tenant_ids()))
  );

-- Comments (with optional parent for threading)
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.task_comments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX idx_task_comments_tenant_task ON public.task_comments(tenant_id, task_id, created_at DESC);
CREATE TRIGGER task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can manage task_comments"
  ON public.task_comments FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Attachments (metadata; file in storage)
CREATE TABLE public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  content_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_task_attachments_task_id ON public.task_attachments(task_id);
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can manage task_attachments"
  ON public.task_attachments FOR ALL
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Activity / audit log
CREATE TABLE public.task_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_activities_task_id ON public.task_activities(task_id);
CREATE INDEX idx_task_activities_tenant_task_created ON public.task_activities(tenant_id, task_id, created_at DESC);
ALTER TABLE public.task_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can view task_activities"
  ON public.task_activities FOR SELECT
  USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY "Tenant members can insert task_activities"
  ON public.task_activities FOR INSERT
  WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

-- Space members (space-level roles: admin, member, viewer)
CREATE TABLE public.space_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.task_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (space_id, user_id)
);

CREATE INDEX idx_space_members_space_id ON public.space_members(space_id);
CREATE INDEX idx_space_members_user_id ON public.space_members(user_id);
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can manage space_members"
  ON public.space_members FOR ALL
  USING (
    space_id IN (SELECT id FROM public.task_spaces WHERE tenant_id IN (SELECT public.user_tenant_ids()))
  );
