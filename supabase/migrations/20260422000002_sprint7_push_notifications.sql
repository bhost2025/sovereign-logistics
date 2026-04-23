-- ============================================================
-- Sprint 7: Push Notifications + Notification Log
-- ============================================================

-- ── 1. device_tokens ────────────────────────────────────────
-- Stores Expo push tokens per user+device.
-- Upserted from mobile app on every login/app-open.

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  company_id  uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  token       text        NOT NULL,
  platform    text        CHECK (platform IN ('ios', 'android', 'web')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS device_tokens_company_idx ON public.device_tokens(company_id);
CREATE INDEX IF NOT EXISTS device_tokens_user_idx    ON public.device_tokens(user_id);

-- RLS: users can manage their own tokens; service role used for reads
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device_tokens_own"
  ON public.device_tokens
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ── 2. notification_log ─────────────────────────────────────
-- Append-only log of every notification dispatch attempt.

CREATE TABLE IF NOT EXISTS public.notification_log (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id       uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type       text        NOT NULL,
  container_id     uuid        REFERENCES public.containers(id) ON DELETE SET NULL,
  container_number text,
  channels         text[]      DEFAULT '{}',   -- e.g. ['email','push']
  recipients_count int         DEFAULT 0,
  status           text        CHECK (status IN ('sent','failed','partial')) DEFAULT 'sent',
  error            text,
  sent_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notification_log_company_idx   ON public.notification_log(company_id);
CREATE INDEX IF NOT EXISTS notification_log_sent_at_idx   ON public.notification_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS notification_log_event_idx     ON public.notification_log(event_type);

-- RLS: company members with view_settings (or super_admin) can read their own logs
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_log_company_select"
  ON public.notification_log FOR SELECT
  USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));


-- ── 3. push_enabled on notification_settings ────────────────
ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS push_enabled boolean DEFAULT false;
