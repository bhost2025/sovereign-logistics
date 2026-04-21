-- ============================================================
-- Sprint 2: Productos por cliente dentro de contenedor (LCL drill-down)
-- ============================================================

CREATE TABLE public.container_products (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id   uuid        NOT NULL REFERENCES public.containers(id)  ON DELETE CASCADE,
  client_id      uuid        NOT NULL REFERENCES public.clients(id)     ON DELETE CASCADE,
  company_id     uuid        NOT NULL REFERENCES public.companies(id)   ON DELETE CASCADE,
  invoice_id     uuid                    REFERENCES public.invoices(id)  ON DELETE SET NULL,
  sku            text,
  description    text        NOT NULL,
  quantity       numeric     NOT NULL DEFAULT 1,
  unit           text,        -- 'cartons' | 'pallets' | 'pieces' | 'kg' | 'pcs'
  declared_value numeric,
  currency       text        NOT NULL DEFAULT 'USD',
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_container_products_container ON public.container_products(container_id);
CREATE INDEX idx_container_products_client    ON public.container_products(client_id);
CREATE INDEX idx_container_products_company   ON public.container_products(company_id);

-- RLS
ALTER TABLE public.container_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "container_products_select"
  ON public.container_products FOR SELECT
  USING (company_id = my_company_id());

CREATE POLICY "container_products_insert"
  ON public.container_products FOR INSERT
  WITH CHECK (
    company_id = my_company_id()
    AND my_role() IN ('operator', 'director', 'super_admin')
  );

CREATE POLICY "container_products_update"
  ON public.container_products FOR UPDATE
  USING (company_id = my_company_id())
  WITH CHECK (
    company_id = my_company_id()
    AND my_role() IN ('operator', 'director', 'super_admin')
  );

CREATE POLICY "container_products_delete"
  ON public.container_products FOR DELETE
  USING (
    company_id = my_company_id()
    AND my_role() IN ('operator', 'super_admin')
  );
