-- Enum para estado de factura
CREATE TYPE public.invoice_status AS ENUM (
  'pendiente',
  'pagada',
  'cancelada'
);

-- Agregar estado a la tabla de facturas
ALTER TABLE public.invoices
  ADD COLUMN status public.invoice_status NOT NULL DEFAULT 'pendiente';

-- Items de factura (productos que envía el cliente)
CREATE TABLE public.invoice_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description  text NOT NULL,
  quantity     numeric(10,2) NOT NULL DEFAULT 1,
  unit         text,                    -- piezas, kg, cajas, pallets, etc.
  unit_price   numeric(12,2) NOT NULL DEFAULT 0,
  total        numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Índice para consultar items por factura
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- RLS: mismas reglas que invoices
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_items_company_isolation" ON public.invoice_items
  USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      JOIN public.containers c ON c.id = i.container_id
      JOIN public.users u ON u.company_id = c.company_id
      WHERE u.id = auth.uid()
    )
  );
