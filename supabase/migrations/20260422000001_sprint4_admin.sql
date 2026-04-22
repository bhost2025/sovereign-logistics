-- ============================================================
-- Sprint 4: Admin, Permissions, Logs, Email, Backups, Cleanup
-- ============================================================

-- 1. ROLE_PERMISSIONS — DB-driven permission matrix
-- ============================================================
CREATE TABLE public.role_permissions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role        text        NOT NULL,  -- 'super_admin' | 'director' | 'operator' | 'operator_cn'
  permission  text        NOT NULL,
  granted     boolean     NOT NULL DEFAULT false,
  updated_by  uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, role, permission)
);

CREATE INDEX idx_role_permissions_company ON public.role_permissions(company_id);
CREATE INDEX idx_role_permissions_lookup  ON public.role_permissions(company_id, role, permission);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rp_select" ON public.role_permissions FOR SELECT
  USING (company_id = public.my_company_id());

CREATE POLICY "rp_all" ON public.role_permissions FOR ALL
  USING (company_id = public.my_company_id() AND public.my_role() = 'super_admin')
  WITH CHECK (company_id = public.my_company_id() AND public.my_role() = 'super_admin');

-- Seed role_permissions for all existing companies (mirrors hardcoded matrix)
DO $$
DECLARE
  cid uuid;
BEGIN
  FOR cid IN SELECT id FROM public.companies LOOP

    -- super_admin: full access to everything
    INSERT INTO public.role_permissions (company_id, role, permission, granted) VALUES
      (cid, 'super_admin', 'view_containers',       true),
      (cid, 'super_admin', 'create_containers',      true),
      (cid, 'super_admin', 'edit_containers',        true),
      (cid, 'super_admin', 'delete_containers',      true),
      (cid, 'super_admin', 'view_clients',           true),
      (cid, 'super_admin', 'create_clients',         true),
      (cid, 'super_admin', 'edit_clients',           true),
      (cid, 'super_admin', 'delete_clients',         true),
      (cid, 'super_admin', 'upload_documents',       true),
      (cid, 'super_admin', 'approve_documents',      true),
      (cid, 'super_admin', 'delete_documents',       true),
      (cid, 'super_admin', 'view_invoices',          true),
      (cid, 'super_admin', 'create_invoices',        true),
      (cid, 'super_admin', 'delete_invoices',        true),
      (cid, 'super_admin', 'create_alerts',          true),
      (cid, 'super_admin', 'resolve_alerts',         true),
      (cid, 'super_admin', 'export_data',            true),
      (cid, 'super_admin', 'manage_clients',         true),
      (cid, 'super_admin', 'manage_settings',        true),
      (cid, 'super_admin', 'manage_users',           true),
      (cid, 'super_admin', 'manage_roles',           true),
      (cid, 'super_admin', 'manage_ports',           true),
      (cid, 'super_admin', 'manage_agencies',        true),
      (cid, 'super_admin', 'manage_notifications',   true),
      (cid, 'super_admin', 'manage_email',           true),
      (cid, 'super_admin', 'view_logs',              true),
      (cid, 'super_admin', 'run_backup',             true),
      (cid, 'super_admin', 'run_cleanup',            true)
    ON CONFLICT DO NOTHING;

    -- director: view + approve + export
    INSERT INTO public.role_permissions (company_id, role, permission, granted) VALUES
      (cid, 'director', 'view_containers',       true),
      (cid, 'director', 'create_containers',     false),
      (cid, 'director', 'edit_containers',       false),
      (cid, 'director', 'delete_containers',     false),
      (cid, 'director', 'view_clients',          true),
      (cid, 'director', 'create_clients',        false),
      (cid, 'director', 'edit_clients',          false),
      (cid, 'director', 'delete_clients',        false),
      (cid, 'director', 'upload_documents',      false),
      (cid, 'director', 'approve_documents',     true),
      (cid, 'director', 'delete_documents',      false),
      (cid, 'director', 'view_invoices',         true),
      (cid, 'director', 'create_invoices',       false),
      (cid, 'director', 'delete_invoices',       false),
      (cid, 'director', 'create_alerts',         false),
      (cid, 'director', 'resolve_alerts',        true),
      (cid, 'director', 'export_data',           true),
      (cid, 'director', 'manage_clients',        true),
      (cid, 'director', 'manage_settings',       false),
      (cid, 'director', 'manage_users',          false),
      (cid, 'director', 'manage_roles',          false),
      (cid, 'director', 'manage_ports',          false),
      (cid, 'director', 'manage_agencies',       false),
      (cid, 'director', 'manage_notifications',  false),
      (cid, 'director', 'manage_email',          false),
      (cid, 'director', 'view_logs',             true),
      (cid, 'director', 'run_backup',            false),
      (cid, 'director', 'run_cleanup',           false)
    ON CONFLICT DO NOTHING;

    -- operator (MX): full operational access
    INSERT INTO public.role_permissions (company_id, role, permission, granted) VALUES
      (cid, 'operator', 'view_containers',       true),
      (cid, 'operator', 'create_containers',     true),
      (cid, 'operator', 'edit_containers',       true),
      (cid, 'operator', 'delete_containers',     false),
      (cid, 'operator', 'view_clients',          true),
      (cid, 'operator', 'create_clients',        true),
      (cid, 'operator', 'edit_clients',          true),
      (cid, 'operator', 'delete_clients',        false),
      (cid, 'operator', 'upload_documents',      true),
      (cid, 'operator', 'approve_documents',     false),
      (cid, 'operator', 'delete_documents',      false),
      (cid, 'operator', 'view_invoices',         true),
      (cid, 'operator', 'create_invoices',       true),
      (cid, 'operator', 'delete_invoices',       false),
      (cid, 'operator', 'create_alerts',         true),
      (cid, 'operator', 'resolve_alerts',        true),
      (cid, 'operator', 'export_data',           false),
      (cid, 'operator', 'manage_clients',        true),
      (cid, 'operator', 'manage_settings',       false),
      (cid, 'operator', 'manage_users',          false),
      (cid, 'operator', 'manage_roles',          false),
      (cid, 'operator', 'manage_ports',          false),
      (cid, 'operator', 'manage_agencies',       true),
      (cid, 'operator', 'manage_notifications',  false),
      (cid, 'operator', 'manage_email',          false),
      (cid, 'operator', 'view_logs',             false),
      (cid, 'operator', 'run_backup',            false),
      (cid, 'operator', 'run_cleanup',           false)
    ON CONFLICT DO NOTHING;

    -- operator_cn: upload + edit, no MX-specific actions
    INSERT INTO public.role_permissions (company_id, role, permission, granted) VALUES
      (cid, 'operator_cn', 'view_containers',       true),
      (cid, 'operator_cn', 'create_containers',     false),
      (cid, 'operator_cn', 'edit_containers',       true),
      (cid, 'operator_cn', 'delete_containers',     false),
      (cid, 'operator_cn', 'view_clients',          true),
      (cid, 'operator_cn', 'create_clients',        false),
      (cid, 'operator_cn', 'edit_clients',          false),
      (cid, 'operator_cn', 'delete_clients',        false),
      (cid, 'operator_cn', 'upload_documents',      true),
      (cid, 'operator_cn', 'approve_documents',     false),
      (cid, 'operator_cn', 'delete_documents',      false),
      (cid, 'operator_cn', 'view_invoices',         true),
      (cid, 'operator_cn', 'create_invoices',       true),
      (cid, 'operator_cn', 'delete_invoices',       false),
      (cid, 'operator_cn', 'create_alerts',         true),
      (cid, 'operator_cn', 'resolve_alerts',        false),
      (cid, 'operator_cn', 'export_data',           false),
      (cid, 'operator_cn', 'manage_clients',        false),
      (cid, 'operator_cn', 'manage_settings',       false),
      (cid, 'operator_cn', 'manage_users',          false),
      (cid, 'operator_cn', 'manage_roles',          false),
      (cid, 'operator_cn', 'manage_ports',          false),
      (cid, 'operator_cn', 'manage_agencies',       false),
      (cid, 'operator_cn', 'manage_notifications',  false),
      (cid, 'operator_cn', 'manage_email',          false),
      (cid, 'operator_cn', 'view_logs',             false),
      (cid, 'operator_cn', 'run_backup',            false),
      (cid, 'operator_cn', 'run_cleanup',           false)
    ON CONFLICT DO NOTHING;

  END LOOP;
END $$;


-- 2. SYSTEM_LOGS — General audit trail
-- ============================================================
CREATE TABLE public.system_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id      uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  user_name    text,
  action       text        NOT NULL,
  -- 'create' | 'update' | 'delete' | 'restore' | 'login' | 'logout'
  -- | 'export' | 'backup' | 'cleanup' | 'permission_change' | 'test_email'
  entity_type  text,
  -- 'container' | 'client' | 'user' | 'invoice' | 'document'
  -- | 'agency' | 'port' | 'role_permission' | 'email_config' | 'system'
  entity_id    uuid,
  entity_label text,
  changes      jsonb,      -- { "field": { "before": x, "after": y } }
  ip_address   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_logs_company     ON public.system_logs(company_id, created_at DESC);
CREATE INDEX idx_system_logs_entity      ON public.system_logs(company_id, entity_type);
CREATE INDEX idx_system_logs_user        ON public.system_logs(company_id, user_id);
CREATE INDEX idx_system_logs_action      ON public.system_logs(company_id, action);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admin and director can view logs; no one can modify them
CREATE POLICY "logs_select" ON public.system_logs FOR SELECT
  USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('super_admin', 'director')
  );

-- INSERT allowed from service role / server actions (anon can't insert directly)
CREATE POLICY "logs_insert" ON public.system_logs FOR INSERT
  WITH CHECK (company_id = public.my_company_id());

-- No UPDATE or DELETE ever — append-only audit log


-- 3. EMAIL_CONFIG — SMTP per company
-- ============================================================
CREATE TABLE public.email_config (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid        UNIQUE NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  smtp_host    text,
  smtp_port    integer     DEFAULT 587,
  smtp_user    text,
  smtp_pass    text,
  encryption   text        DEFAULT 'tls' CHECK (encryption IN ('tls', 'ssl', 'none')),
  from_name    text,
  from_email   text,
  is_verified  boolean     DEFAULT false,
  last_test_at timestamptz,
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE public.email_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_config_select" ON public.email_config FOR SELECT
  USING (company_id = public.my_company_id() AND public.my_role() = 'super_admin');

CREATE POLICY "email_config_all" ON public.email_config FOR ALL
  USING (company_id = public.my_company_id() AND public.my_role() = 'super_admin')
  WITH CHECK (company_id = public.my_company_id() AND public.my_role() = 'super_admin');

-- Seed empty row for existing companies
INSERT INTO public.email_config (company_id)
SELECT id FROM public.companies
ON CONFLICT DO NOTHING;


-- 4. BACKUPS — Backup registry
-- ============================================================
CREATE TABLE public.backups (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  triggered_by  uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  triggered_by_name text,
  status        text        NOT NULL DEFAULT 'done'
                            CHECK (status IN ('pending', 'running', 'done', 'failed')),
  file_size_kb  integer,
  entity_counts jsonb,      -- { containers: N, clients: N, ... }
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_backups_company ON public.backups(company_id, created_at DESC);

ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backups_select" ON public.backups FOR SELECT
  USING (company_id = public.my_company_id() AND public.my_role() IN ('super_admin', 'director'));

CREATE POLICY "backups_insert" ON public.backups FOR INSERT
  WITH CHECK (company_id = public.my_company_id() AND public.my_role() = 'super_admin');


-- 5. SOFT DELETE — Add deleted_at to operational tables
-- ============================================================
ALTER TABLE public.containers ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.clients    ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.invoices   ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Update existing RLS policies to filter soft-deleted rows
-- (Re-create the SELECT policies to add the IS NULL check)

DROP POLICY IF EXISTS "containers_select" ON public.containers;
CREATE POLICY "containers_select" ON public.containers FOR SELECT
  USING (company_id = public.my_company_id() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "clients_select" ON public.clients;
CREATE POLICY "clients_select" ON public.clients FOR SELECT
  USING (company_id = public.my_company_id() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.containers c
      WHERE c.id = container_id
        AND c.company_id = public.my_company_id()
        AND c.deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

-- Also update DELETE policies to instead be soft-delete via UPDATE
DROP POLICY IF EXISTS "containers_delete" ON public.containers;
CREATE POLICY "containers_delete" ON public.containers FOR UPDATE
  USING (company_id = public.my_company_id() AND public.my_role() = 'super_admin');
-- Note: actual soft-delete is done via UPDATE setting deleted_at, controlled in app layer

-- last_updated_by column on containers (for tracking edits)
ALTER TABLE public.containers ADD COLUMN IF NOT EXISTS last_updated_by uuid REFERENCES public.users(id);
