CREATE TABLE public.companies (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text UNIQUE NOT NULL,
  logo_url   text,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  uuid NOT NULL REFERENCES public.companies(id),
  full_name   text NOT NULL,
  email       text NOT NULL,
  role        public.user_role NOT NULL DEFAULT 'operator',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES public.companies(id),
  name          text NOT NULL,
  contact_name  text,
  email         text,
  phone         text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.containers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES public.companies(id),
  container_number text NOT NULL,
  bl_number        text,
  origin_port      text NOT NULL,
  destination_port text NOT NULL DEFAULT 'Manzanillo',
  current_status   public.container_status NOT NULL DEFAULT 'en_puerto_origen',
  departure_date   date,
  eta_date         date,
  arrival_date     date,
  notes            text,
  created_by       uuid REFERENCES public.users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, container_number)
);

CREATE TABLE public.container_clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id  uuid NOT NULL REFERENCES public.containers(id) ON DELETE CASCADE,
  client_id     uuid NOT NULL REFERENCES public.clients(id),
  share_pct     numeric(5,2),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(container_id, client_id)
);

CREATE TABLE public.invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id    uuid NOT NULL REFERENCES public.containers(id) ON DELETE CASCADE,
  client_id       uuid NOT NULL REFERENCES public.clients(id),
  invoice_number  text NOT NULL,
  description     text,
  declared_value  numeric(12,2),
  currency        text NOT NULL DEFAULT 'USD',
  file_url        text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.container_status_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id     uuid NOT NULL REFERENCES public.containers(id) ON DELETE CASCADE,
  previous_status  public.container_status,
  new_status       public.container_status NOT NULL,
  changed_by       uuid REFERENCES public.users(id),
  notes            text,
  changed_at       timestamptz NOT NULL DEFAULT now()
);
