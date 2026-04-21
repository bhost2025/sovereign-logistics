-- ============================================================
-- Sprint 3: Settings — Ports, Agencies, Notification Settings
-- ============================================================

-- 1. Ports
CREATE TABLE public.ports (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  country    text        NOT NULL, -- 'China' | 'Mexico' | 'Other'
  code       text,
  type       text        NOT NULL DEFAULT 'both', -- 'origin' | 'destination' | 'both'
  active     boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ports_company ON public.ports(company_id);

ALTER TABLE public.ports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ports_select" ON public.ports FOR SELECT USING (company_id = my_company_id());
CREATE POLICY "ports_insert" ON public.ports FOR INSERT WITH CHECK (company_id = my_company_id() AND my_role() IN ('operator','director','super_admin'));
CREATE POLICY "ports_update" ON public.ports FOR UPDATE USING (company_id = my_company_id()) WITH CHECK (company_id = my_company_id() AND my_role() IN ('operator','director','super_admin'));
CREATE POLICY "ports_delete" ON public.ports FOR DELETE USING (company_id = my_company_id() AND my_role() = 'super_admin');

-- 2. Agencies / Providers
CREATE TABLE public.agencies (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name             text        NOT NULL,
  type             text        NOT NULL, -- 'customs' | 'freight_forwarder' | 'transport'
  contact_name     text,
  contact_email    text,
  contact_phone    text,
  notes            text,
  specialization   text,
  active           boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_agencies_company ON public.agencies(company_id);

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agencies_select" ON public.agencies FOR SELECT USING (company_id = my_company_id());
CREATE POLICY "agencies_insert" ON public.agencies FOR INSERT WITH CHECK (company_id = my_company_id() AND my_role() IN ('operator','director','super_admin'));
CREATE POLICY "agencies_update" ON public.agencies FOR UPDATE USING (company_id = my_company_id()) WITH CHECK (company_id = my_company_id() AND my_role() IN ('operator','director','super_admin'));
CREATE POLICY "agencies_delete" ON public.agencies FOR DELETE USING (company_id = my_company_id() AND my_role() = 'super_admin');

-- 3. Notification Settings
CREATE TABLE public.notification_settings (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type      text        NOT NULL,
  -- 'container_detained' | 'missing_docs' | 'overdue_eta' | 'not_updated' | 'eta_soon'
  enabled         boolean     NOT NULL DEFAULT true,
  notify_roles    text[]      NOT NULL DEFAULT '{}',
  days_threshold  integer,    -- for not_updated / eta_soon events
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, event_type)
);

CREATE INDEX idx_notification_settings_company ON public.notification_settings(company_id);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_settings_select" ON public.notification_settings FOR SELECT USING (company_id = my_company_id());
CREATE POLICY "notif_settings_all"    ON public.notification_settings FOR ALL   USING (company_id = my_company_id() AND my_role() = 'super_admin');

-- Seed default notification settings for existing companies
INSERT INTO public.notification_settings (company_id, event_type, enabled, notify_roles, days_threshold)
SELECT id, 'container_detained', true, ARRAY['director','super_admin'], NULL FROM public.companies
ON CONFLICT DO NOTHING;

INSERT INTO public.notification_settings (company_id, event_type, enabled, notify_roles, days_threshold)
SELECT id, 'missing_docs', true, ARRAY['operator','super_admin'], NULL FROM public.companies
ON CONFLICT DO NOTHING;

INSERT INTO public.notification_settings (company_id, event_type, enabled, notify_roles, days_threshold)
SELECT id, 'eta_soon', true, ARRAY['operator','director','super_admin'], 3 FROM public.companies
ON CONFLICT DO NOTHING;

INSERT INTO public.notification_settings (company_id, event_type, enabled, notify_roles, days_threshold)
SELECT id, 'not_updated', true, ARRAY['director','super_admin'], 5 FROM public.companies
ON CONFLICT DO NOTHING;
