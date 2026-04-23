-- ============================================================
-- SOVEREIGN LOGISTICS — SQL DE PRODUCCIÓN COMPLETO
-- Pegar en: Supabase Dashboard → SQL Editor → New Query
-- Ejecutar TODO de una sola vez.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- BLOQUE 1: ENUMS
-- ────────────────────────────────────────────────────────────
CREATE TYPE public.user_role AS ENUM (
  'super_admin', 'operator', 'director', 'client_viewer'
);

CREATE TYPE public.container_status AS ENUM (
  'en_puerto_origen', 'zarpo', 'en_transito_maritimo', 'eta_puerto_destino',
  'en_aduana', 'liberado_aduana', 'detenido_aduana', 'transito_terrestre', 'entregado'
);

CREATE TYPE public.invoice_status AS ENUM (
  'pendiente', 'pagada', 'cancelada'
);

CREATE TYPE public.doc_status AS ENUM (
  'uploaded', 'pending_review', 'approved', 'rejected'
);


-- ────────────────────────────────────────────────────────────
-- BLOQUE 2: TABLAS BASE
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.companies (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  slug       text        UNIQUE NOT NULL,
  logo_url   text,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  uuid        NOT NULL REFERENCES public.companies(id),
  full_name   text        NOT NULL,
  email       text        NOT NULL,
  role        public.user_role NOT NULL DEFAULT 'operator',
  is_active   boolean     NOT NULL DEFAULT true,
  language    varchar(5)  NOT NULL DEFAULT 'es' CHECK (language IN ('es','en','zh')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid        NOT NULL REFERENCES public.companies(id),
  name          text        NOT NULL,
  contact_name  text,
  email         text,
  phone         text,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.containers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid        NOT NULL REFERENCES public.companies(id),
  container_number text        NOT NULL,
  bl_number        text,
  origin_port      text        NOT NULL,
  destination_port text        NOT NULL DEFAULT 'Manzanillo',
  current_status   public.container_status NOT NULL DEFAULT 'en_puerto_origen',
  departure_date   date,
  eta_date         date,
  arrival_date     date,
  notes            text,
  deleted_at       timestamptz,
  created_by       uuid        REFERENCES public.users(id),
  last_updated_by  uuid        REFERENCES public.users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, container_number)
);

CREATE TABLE public.container_clients (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id uuid        NOT NULL REFERENCES public.containers(id) ON DELETE CASCADE,
  client_id    uuid        NOT NULL REFERENCES public.clients(id),
  share_pct    numeric(5,2),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(container_id, client_id)
);

CREATE TABLE public.container_status_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id    uuid        NOT NULL REFERENCES public.containers(id) ON DELETE CASCADE,
  previous_status public.container_status,
  new_status      public.container_status NOT NULL,
  changed_by      uuid        REFERENCES public.users(id),
  notes           text,
  changed_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id    uuid        NOT NULL REFERENCES public.containers(id) ON DELETE CASCADE,
  client_id       uuid        REFERENCES public.clients(id),
  invoice_number  text        NOT NULL,
  description     text,
  declared_value  numeric(12,2),
  currency        text        NOT NULL DEFAULT 'USD',
  file_url        text,
  status          public.invoice_status NOT NULL DEFAULT 'pendiente',
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.invoice_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid        NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description  text        NOT NULL,
  quantity     numeric(10,2) NOT NULL DEFAULT 1,
  unit         text,
  unit_price   numeric(12,2) NOT NULL DEFAULT 0,
  total        numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.container_documents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id uuid        NOT NULL REFERENCES public.containers(id) ON DELETE CASCADE,
  company_id   uuid        NOT NULL REFERENCES public.companies(id)  ON DELETE CASCADE,
  category     text        NOT NULL,
  file_name    text        NOT NULL,
  file_url     text        NOT NULL,
  doc_status   public.doc_status NOT NULL DEFAULT 'uploaded',
  comments     text,
  uploaded_by  uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_by  uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.container_products (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id   uuid        NOT NULL REFERENCES public.containers(id)  ON DELETE CASCADE,
  client_id      uuid        NOT NULL REFERENCES public.clients(id)     ON DELETE CASCADE,
  company_id     uuid        NOT NULL REFERENCES public.companies(id)   ON DELETE CASCADE,
  invoice_id     uuid                    REFERENCES public.invoices(id)  ON DELETE SET NULL,
  sku            text,
  description    text        NOT NULL,
  quantity       numeric     NOT NULL DEFAULT 1,
  unit           text,
  declared_value numeric,
  currency       text        NOT NULL DEFAULT 'USD',
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ports (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  country    text        NOT NULL,
  code       text,
  type       text        NOT NULL DEFAULT 'both',
  active     boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.agencies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  type            text        NOT NULL,
  contact_name    text,
  contact_email   text,
  contact_phone   text,
  notes           text,
  specialization  text,
  active          boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notification_settings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type     text        NOT NULL,
  enabled        boolean     NOT NULL DEFAULT true,
  push_enabled   boolean     NOT NULL DEFAULT false,
  notify_roles   text[]      NOT NULL DEFAULT '{}',
  days_threshold integer,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, event_type)
);

CREATE TABLE public.email_config (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid        UNIQUE NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  smtp_host    text,
  smtp_port    integer     DEFAULT 587,
  smtp_user    text,
  smtp_pass    text,
  encryption   text        DEFAULT 'tls' CHECK (encryption IN ('tls','ssl','none')),
  from_name    text,
  from_email   text,
  is_verified  boolean     DEFAULT false,
  last_test_at timestamptz,
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE public.role_permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role        text        NOT NULL,
  permission  text        NOT NULL,
  granted     boolean     NOT NULL DEFAULT false,
  updated_by  uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, role, permission)
);

CREATE TABLE public.system_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id      uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  user_name    text,
  action       text        NOT NULL,
  entity_type  text,
  entity_id    uuid,
  entity_label text,
  changes      jsonb,
  ip_address   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.backups (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  triggered_by       uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  triggered_by_name  text,
  status             text        NOT NULL DEFAULT 'done'
                                 CHECK (status IN ('pending','running','done','failed')),
  file_size_kb       integer,
  entity_counts      jsonb,
  error              text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.device_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  company_id  uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  token       text        NOT NULL,
  platform    text        CHECK (platform IN ('ios','android','web')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, token)
);

CREATE TABLE public.notification_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type       text        NOT NULL,
  container_id     uuid        REFERENCES public.containers(id) ON DELETE SET NULL,
  container_number text,
  channels         text[]      DEFAULT '{}',
  recipients_count int         DEFAULT 0,
  status           text        CHECK (status IN ('sent','failed','partial')) DEFAULT 'sent',
  error            text,
  sent_at          timestamptz DEFAULT now()
);

ALTER TABLE public.clients    ADD COLUMN IF NOT EXISTS deleted_at timestamptz;


-- ────────────────────────────────────────────────────────────
-- BLOQUE 3: ÍNDICES
-- ────────────────────────────────────────────────────────────
CREATE INDEX idx_containers_company    ON public.containers(company_id);
CREATE INDEX idx_containers_status     ON public.containers(current_status);
CREATE INDEX idx_containers_number     ON public.containers(container_number);
CREATE INDEX idx_status_log_container  ON public.container_status_log(container_id);
CREATE INDEX idx_invoices_container    ON public.invoices(container_id);
CREATE INDEX idx_users_company         ON public.users(company_id);
CREATE INDEX idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX idx_container_documents_container ON public.container_documents(container_id);
CREATE INDEX idx_container_documents_company   ON public.container_documents(company_id);
CREATE INDEX idx_container_products_container  ON public.container_products(container_id);
CREATE INDEX idx_container_products_client     ON public.container_products(client_id);
CREATE INDEX idx_ports_company         ON public.ports(company_id);
CREATE INDEX idx_agencies_company      ON public.agencies(company_id);
CREATE INDEX idx_notification_settings_company ON public.notification_settings(company_id);
CREATE INDEX idx_role_permissions_company      ON public.role_permissions(company_id);
CREATE INDEX idx_role_permissions_lookup       ON public.role_permissions(company_id, role, permission);
CREATE INDEX idx_system_logs_company   ON public.system_logs(company_id, created_at DESC);
CREATE INDEX idx_system_logs_entity    ON public.system_logs(company_id, entity_type);
CREATE INDEX idx_system_logs_user      ON public.system_logs(company_id, user_id);
CREATE INDEX idx_backups_company       ON public.backups(company_id, created_at DESC);
CREATE INDEX device_tokens_company_idx ON public.device_tokens(company_id);
CREATE INDEX notification_log_company_idx ON public.notification_log(company_id);
CREATE INDEX notification_log_sent_at_idx ON public.notification_log(sent_at DESC);


-- ────────────────────────────────────────────────────────────
-- BLOQUE 4: RLS + HELPER FUNCTIONS
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.companies             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.containers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.container_clients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.container_status_log  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.container_documents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.container_products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ports                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_config          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log      ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.my_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.my_role()
RETURNS public.user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

-- Policies: companies
CREATE POLICY "companies_select" ON public.companies FOR SELECT
  USING (id = public.my_company_id());

-- Policies: users
CREATE POLICY "users_select" ON public.users FOR SELECT
  USING (company_id = public.my_company_id());
CREATE POLICY "users_insert" ON public.users FOR INSERT
  WITH CHECK (company_id = public.my_company_id() AND public.my_role() = 'super_admin');
CREATE POLICY "users_update" ON public.users FOR UPDATE
  USING (company_id = public.my_company_id() AND public.my_role() = 'super_admin');

-- Policies: clients (soft-delete aware)
CREATE POLICY "clients_select" ON public.clients FOR SELECT
  USING (company_id = public.my_company_id() AND deleted_at IS NULL);
CREATE POLICY "clients_insert" ON public.clients FOR INSERT
  WITH CHECK (company_id = public.my_company_id()
    AND public.my_role() IN ('operator','super_admin'));
CREATE POLICY "clients_update" ON public.clients FOR UPDATE
  USING (company_id = public.my_company_id()
    AND public.my_role() IN ('operator','super_admin'));

-- Policies: containers (soft-delete aware)
CREATE POLICY "containers_select" ON public.containers FOR SELECT
  USING (company_id = public.my_company_id() AND deleted_at IS NULL);
CREATE POLICY "containers_insert" ON public.containers FOR INSERT
  WITH CHECK (company_id = public.my_company_id()
    AND public.my_role() IN ('operator','super_admin'));
CREATE POLICY "containers_update" ON public.containers FOR UPDATE
  USING (company_id = public.my_company_id()
    AND public.my_role() IN ('operator','super_admin'));

-- Policies: container_clients
CREATE POLICY "cc_select" ON public.container_clients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.containers c
    WHERE c.id = container_id AND c.company_id = public.my_company_id()
  ));
CREATE POLICY "cc_insert" ON public.container_clients FOR INSERT
  WITH CHECK (public.my_role() IN ('operator','super_admin'));
CREATE POLICY "cc_delete" ON public.container_clients FOR DELETE
  USING (public.my_role() IN ('operator','super_admin'));

-- Policies: invoices (soft-delete aware)
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
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT
  WITH CHECK (public.my_role() IN ('operator','super_admin'));
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE
  USING (public.my_role() IN ('operator','super_admin'));

-- Policies: invoice_items
CREATE POLICY "invoice_items_company_isolation" ON public.invoice_items
  USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      JOIN public.containers c ON c.id = i.container_id
      JOIN public.users u ON u.company_id = c.company_id
      WHERE u.id = auth.uid()
    )
  );

-- Policies: container_status_log
CREATE POLICY "log_select" ON public.container_status_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.containers c
    WHERE c.id = container_id AND c.company_id = public.my_company_id()
  ));
CREATE POLICY "log_insert" ON public.container_status_log FOR INSERT
  WITH CHECK (public.my_role() IN ('operator','super_admin'));

-- Policies: container_documents
CREATE POLICY "container_documents_select" ON public.container_documents FOR SELECT
  USING (company_id = public.my_company_id());
CREATE POLICY "container_documents_insert" ON public.container_documents FOR INSERT
  WITH CHECK (company_id = public.my_company_id()
    AND public.my_role() IN ('operator','director','super_admin'));
CREATE POLICY "container_documents_update" ON public.container_documents FOR UPDATE
  USING (company_id = public.my_company_id())
  WITH CHECK (company_id = public.my_company_id()
    AND public.my_role() IN ('operator','director','super_admin'));
CREATE POLICY "container_documents_delete" ON public.container_documents FOR DELETE
  USING (company_id = public.my_company_id() AND public.my_role() = 'super_admin');

-- Policies: container_products
CREATE POLICY "container_products_select" ON public.container_products FOR SELECT
  USING (company_id = public.my_company_id());
CREATE POLICY "container_products_insert" ON public.container_products FOR INSERT
  WITH CHECK (company_id = public.my_company_id()
    AND public.my_role() IN ('operator','director','super_admin'));
CREATE POLICY "container_products_update" ON public.container_products FOR UPDATE
  USING (company_id = public.my_company_id())
  WITH CHECK (company_id = public.my_company_id()
    AND public.my_role() IN ('operator','director','super_admin'));
CREATE POLICY "container_products_delete" ON public.container_products FOR DELETE
  USING (company_id = public.my_company_id()
    AND public.my_role() IN ('operator','super_admin'));

-- Policies: ports
CREATE POLICY "ports_select" ON public.ports FOR SELECT
  USING (company_id = public.my_company_id());
CREATE POLICY "ports_insert" ON public.ports FOR INSERT
  WITH CHECK (company_id = public.my_company_id()
    AND public.my_role() IN ('operator','director','super_admin'));
CREATE POLICY "ports_update" ON public.ports FOR UPDATE
  USING (company_id = public.my_company_id())
  WITH CHECK (company_id = public.my_company_id()
    AND public.my_role() IN ('operator','director','super_admin'));
CREATE POLICY "ports_delete" ON public.ports FOR DELETE
  USING (company_id = public.my_company_id() AND public.my_role() = 'super_admin');

-- Policies: agencies
CREATE POLICY "agencies_select" ON public.agencies FOR SELECT
  USING (company_id = public.my_company_id());
CREATE POLICY "agencies_insert" ON public.agencies FOR INSERT
  WITH CHECK (company_id = public.my_company_id()
    AND public.my_role() IN ('operator','director','super_admin'));
CREATE POLICY "agencies_update" ON public.agencies FOR UPDATE
  USING (company_id = public.my_company_id())
  WITH CHECK (company_id = public.my_company_id()
    AND public.my_role() IN ('operator','director','super_admin'));
CREATE POLICY "agencies_delete" ON public.agencies FOR DELETE
  USING (company_id = public.my_company_id() AND public.my_role() = 'super_admin');

-- Policies: notification_settings
CREATE POLICY "notif_settings_select" ON public.notification_settings FOR SELECT
  USING (company_id = public.my_company_id());
CREATE POLICY "notif_settings_all" ON public.notification_settings FOR ALL
  USING (company_id = public.my_company_id() AND public.my_role() = 'super_admin');

-- Policies: email_config
CREATE POLICY "email_config_select" ON public.email_config FOR SELECT
  USING (company_id = public.my_company_id() AND public.my_role() = 'super_admin');
CREATE POLICY "email_config_all" ON public.email_config FOR ALL
  USING (company_id = public.my_company_id() AND public.my_role() = 'super_admin')
  WITH CHECK (company_id = public.my_company_id() AND public.my_role() = 'super_admin');

-- Policies: role_permissions
CREATE POLICY "rp_select" ON public.role_permissions FOR SELECT
  USING (company_id = public.my_company_id());
CREATE POLICY "rp_all" ON public.role_permissions FOR ALL
  USING (company_id = public.my_company_id() AND public.my_role() = 'super_admin')
  WITH CHECK (company_id = public.my_company_id() AND public.my_role() = 'super_admin');

-- Policies: system_logs
CREATE POLICY "logs_select" ON public.system_logs FOR SELECT
  USING (company_id = public.my_company_id()
    AND public.my_role() IN ('super_admin','director'));
CREATE POLICY "logs_insert" ON public.system_logs FOR INSERT
  WITH CHECK (company_id = public.my_company_id());

-- Policies: backups
CREATE POLICY "backups_select" ON public.backups FOR SELECT
  USING (company_id = public.my_company_id()
    AND public.my_role() IN ('super_admin','director'));
CREATE POLICY "backups_insert" ON public.backups FOR INSERT
  WITH CHECK (company_id = public.my_company_id() AND public.my_role() = 'super_admin');

-- Policies: device_tokens
CREATE POLICY "device_tokens_own" ON public.device_tokens FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies: notification_log
CREATE POLICY "notification_log_company_select" ON public.notification_log FOR SELECT
  USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));


-- ────────────────────────────────────────────────────────────
-- BLOQUE 5: EMPRESA + PRIMER USUARIO
-- ────────────────────────────────────────────────────────────
-- INSTRUCCIONES:
--   1. Reemplaza los valores marcados con <  >
--   2. Crea primero el usuario en: Supabase → Authentication → Users → Invite user
--   3. Espera a que el usuario acepte la invitación y establezca contraseña
--   4. Copia el UUID del usuario de la columna "User UID"
--   5. Pega ese UUID en lugar de <UUID-DEL-USUARIO>

-- Crear empresa
INSERT INTO public.companies (name, slug)
VALUES (
  '<NOMBRE DE LA EMPRESA>',   -- ej: 'Sovereign Logistics'
  '<slug-empresa>'            -- ej: 'sovereign-logistics'  (solo letras, números, guiones)
);

-- Obtener el UUID de la empresa recién creada:
-- SELECT id FROM public.companies WHERE slug = '<slug-empresa>';

-- Crear perfil del primer super_admin
-- (sustituye ambos UUIDs antes de ejecutar)
INSERT INTO public.users (id, company_id, full_name, email, role)
VALUES (
  '<UUID-DEL-USUARIO>',     -- de Supabase → Authentication → Users
  (SELECT id FROM public.companies WHERE slug = '<slug-empresa>'),
  '<Nombre Completo>',      -- ej: 'Juan Pérez'
  '<email@empresa.com>',
  'super_admin'
);

-- ────────────────────────────────────────────────────────────
-- BLOQUE 6: SEED DE PERMISOS Y CONFIGURACIÓN INICIAL
-- (se ejecuta automáticamente para la empresa recién creada)
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  cid uuid := (SELECT id FROM public.companies WHERE slug = '<slug-empresa>');
BEGIN

  -- Permisos por rol
  INSERT INTO public.role_permissions (company_id, role, permission, granted) VALUES
    -- super_admin: acceso total
    (cid,'super_admin','view_containers',true),
    (cid,'super_admin','create_containers',true),
    (cid,'super_admin','edit_containers',true),
    (cid,'super_admin','delete_containers',true),
    (cid,'super_admin','view_clients',true),
    (cid,'super_admin','create_clients',true),
    (cid,'super_admin','edit_clients',true),
    (cid,'super_admin','delete_clients',true),
    (cid,'super_admin','upload_documents',true),
    (cid,'super_admin','approve_documents',true),
    (cid,'super_admin','delete_documents',true),
    (cid,'super_admin','view_invoices',true),
    (cid,'super_admin','create_invoices',true),
    (cid,'super_admin','delete_invoices',true),
    (cid,'super_admin','create_alerts',true),
    (cid,'super_admin','resolve_alerts',true),
    (cid,'super_admin','export_data',true),
    (cid,'super_admin','manage_clients',true),
    (cid,'super_admin','manage_settings',true),
    (cid,'super_admin','manage_users',true),
    (cid,'super_admin','manage_roles',true),
    (cid,'super_admin','manage_ports',true),
    (cid,'super_admin','manage_agencies',true),
    (cid,'super_admin','manage_notifications',true),
    (cid,'super_admin','manage_email',true),
    (cid,'super_admin','view_logs',true),
    (cid,'super_admin','run_backup',true),
    (cid,'super_admin','run_cleanup',true),
    -- director: ver + aprobar + exportar
    (cid,'director','view_containers',true),
    (cid,'director','create_containers',false),
    (cid,'director','edit_containers',false),
    (cid,'director','delete_containers',false),
    (cid,'director','view_clients',true),
    (cid,'director','create_clients',false),
    (cid,'director','edit_clients',false),
    (cid,'director','delete_clients',false),
    (cid,'director','upload_documents',false),
    (cid,'director','approve_documents',true),
    (cid,'director','delete_documents',false),
    (cid,'director','view_invoices',true),
    (cid,'director','create_invoices',false),
    (cid,'director','delete_invoices',false),
    (cid,'director','create_alerts',false),
    (cid,'director','resolve_alerts',true),
    (cid,'director','export_data',true),
    (cid,'director','manage_clients',true),
    (cid,'director','manage_settings',false),
    (cid,'director','manage_users',false),
    (cid,'director','manage_roles',false),
    (cid,'director','manage_ports',false),
    (cid,'director','manage_agencies',false),
    (cid,'director','manage_notifications',false),
    (cid,'director','manage_email',false),
    (cid,'director','view_logs',true),
    (cid,'director','run_backup',false),
    (cid,'director','run_cleanup',false),
    -- operator (MX): operaciones completas
    (cid,'operator','view_containers',true),
    (cid,'operator','create_containers',true),
    (cid,'operator','edit_containers',true),
    (cid,'operator','delete_containers',false),
    (cid,'operator','view_clients',true),
    (cid,'operator','create_clients',true),
    (cid,'operator','edit_clients',true),
    (cid,'operator','delete_clients',false),
    (cid,'operator','upload_documents',true),
    (cid,'operator','approve_documents',false),
    (cid,'operator','delete_documents',false),
    (cid,'operator','view_invoices',true),
    (cid,'operator','create_invoices',true),
    (cid,'operator','delete_invoices',false),
    (cid,'operator','create_alerts',true),
    (cid,'operator','resolve_alerts',true),
    (cid,'operator','export_data',false),
    (cid,'operator','manage_clients',true),
    (cid,'operator','manage_settings',false),
    (cid,'operator','manage_users',false),
    (cid,'operator','manage_roles',false),
    (cid,'operator','manage_ports',false),
    (cid,'operator','manage_agencies',true),
    (cid,'operator','manage_notifications',false),
    (cid,'operator','manage_email',false),
    (cid,'operator','view_logs',false),
    (cid,'operator','run_backup',false),
    (cid,'operator','run_cleanup',false),
    -- operator_cn: subir + editar, sin acciones MX
    (cid,'operator_cn','view_containers',true),
    (cid,'operator_cn','create_containers',false),
    (cid,'operator_cn','edit_containers',true),
    (cid,'operator_cn','delete_containers',false),
    (cid,'operator_cn','view_clients',true),
    (cid,'operator_cn','create_clients',false),
    (cid,'operator_cn','edit_clients',false),
    (cid,'operator_cn','delete_clients',false),
    (cid,'operator_cn','upload_documents',true),
    (cid,'operator_cn','approve_documents',false),
    (cid,'operator_cn','delete_documents',false),
    (cid,'operator_cn','view_invoices',true),
    (cid,'operator_cn','create_invoices',true),
    (cid,'operator_cn','delete_invoices',false),
    (cid,'operator_cn','create_alerts',true),
    (cid,'operator_cn','resolve_alerts',false),
    (cid,'operator_cn','export_data',false),
    (cid,'operator_cn','manage_clients',false),
    (cid,'operator_cn','manage_settings',false),
    (cid,'operator_cn','manage_users',false),
    (cid,'operator_cn','manage_roles',false),
    (cid,'operator_cn','manage_ports',false),
    (cid,'operator_cn','manage_agencies',false),
    (cid,'operator_cn','manage_notifications',false),
    (cid,'operator_cn','manage_email',false),
    (cid,'operator_cn','view_logs',false),
    (cid,'operator_cn','run_backup',false),
    (cid,'operator_cn','run_cleanup',false)
  ON CONFLICT DO NOTHING;

  -- Notificaciones por defecto
  INSERT INTO public.notification_settings (company_id, event_type, enabled, push_enabled, notify_roles, days_threshold) VALUES
    (cid,'container_detained', true,  false, ARRAY['director','super_admin'], NULL),
    (cid,'missing_docs',       true,  false, ARRAY['operator','super_admin'], NULL),
    (cid,'eta_soon',           true,  false, ARRAY['operator','director','super_admin'], 3),
    (cid,'not_updated',        true,  false, ARRAY['director','super_admin'], 5)
  ON CONFLICT DO NOTHING;

  -- Fila vacía de email config (se completa desde /settings/email)
  INSERT INTO public.email_config (company_id)
  VALUES (cid)
  ON CONFLICT DO NOTHING;

END $$;
