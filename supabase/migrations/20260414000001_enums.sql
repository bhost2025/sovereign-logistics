CREATE TYPE public.user_role AS ENUM (
  'super_admin',
  'operator',
  'director',
  'client_viewer'
);

CREATE TYPE public.container_status AS ENUM (
  'en_puerto_origen',
  'zarpo',
  'en_transito_maritimo',
  'eta_puerto_destino',
  'en_aduana',
  'liberado_aduana',
  'detenido_aduana',
  'transito_terrestre',
  'entregado'
);
