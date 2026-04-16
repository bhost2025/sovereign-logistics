ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS language varchar(5) NOT NULL DEFAULT 'es'
  CHECK (language IN ('es', 'en', 'zh'));
