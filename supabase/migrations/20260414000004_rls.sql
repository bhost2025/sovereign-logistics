-- Habilitar RLS en todas las tablas
ALTER TABLE public.companies            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.containers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.container_clients    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.container_status_log ENABLE ROW LEVEL SECURITY;

-- Helper function: obtiene company_id del usuario autenticado
CREATE OR REPLACE FUNCTION public.my_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid()
$$;

-- Helper function: obtiene rol del usuario autenticado
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS public.user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

-- COMPANIES: cada usuario ve solo su empresa
CREATE POLICY "companies_select" ON public.companies FOR SELECT
  USING (id = public.my_company_id());

-- USERS: SELECT propio tenant, mutación solo super_admin
CREATE POLICY "users_select" ON public.users FOR SELECT
  USING (company_id = public.my_company_id());
CREATE POLICY "users_insert" ON public.users FOR INSERT
  WITH CHECK (company_id = public.my_company_id() AND public.my_role() = 'super_admin');
CREATE POLICY "users_update" ON public.users FOR UPDATE
  USING (company_id = public.my_company_id() AND public.my_role() = 'super_admin');

-- CLIENTS: SELECT todos, mutación operator+
CREATE POLICY "clients_select" ON public.clients FOR SELECT
  USING (company_id = public.my_company_id());
CREATE POLICY "clients_insert" ON public.clients FOR INSERT
  WITH CHECK (company_id = public.my_company_id()
    AND public.my_role() IN ('operator', 'super_admin'));
CREATE POLICY "clients_update" ON public.clients FOR UPDATE
  USING (company_id = public.my_company_id()
    AND public.my_role() IN ('operator', 'super_admin'));

-- CONTAINERS: SELECT todos del tenant, mutación solo operator+
CREATE POLICY "containers_select" ON public.containers FOR SELECT
  USING (company_id = public.my_company_id());
CREATE POLICY "containers_insert" ON public.containers FOR INSERT
  WITH CHECK (company_id = public.my_company_id()
    AND public.my_role() IN ('operator', 'super_admin'));
CREATE POLICY "containers_update" ON public.containers FOR UPDATE
  USING (company_id = public.my_company_id()
    AND public.my_role() IN ('operator', 'super_admin'));
CREATE POLICY "containers_delete" ON public.containers FOR DELETE
  USING (company_id = public.my_company_id()
    AND public.my_role() = 'super_admin');

-- CONTAINER_CLIENTS: hereda acceso del contenedor
CREATE POLICY "cc_select" ON public.container_clients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.containers c
    WHERE c.id = container_id AND c.company_id = public.my_company_id()
  ));
CREATE POLICY "cc_insert" ON public.container_clients FOR INSERT
  WITH CHECK (public.my_role() IN ('operator', 'super_admin'));
CREATE POLICY "cc_delete" ON public.container_clients FOR DELETE
  USING (public.my_role() IN ('operator', 'super_admin'));

-- INVOICES: SELECT todos, mutación operator+
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.containers c
    WHERE c.id = container_id AND c.company_id = public.my_company_id()
  ));
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT
  WITH CHECK (public.my_role() IN ('operator', 'super_admin'));
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE
  USING (public.my_role() IN ('operator', 'super_admin'));

-- STATUS_LOG: SELECT todos, INSERT operator+ (nunca UPDATE/DELETE — es auditoría)
CREATE POLICY "log_select" ON public.container_status_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.containers c
    WHERE c.id = container_id AND c.company_id = public.my_company_id()
  ));
CREATE POLICY "log_insert" ON public.container_status_log FOR INSERT
  WITH CHECK (public.my_role() IN ('operator', 'super_admin'));
