-- ============================================================
-- Sprint 1: Módulo de Documentos + Last Updated By
-- ============================================================

-- 1. Enum para estado de documentos
CREATE TYPE public.doc_status AS ENUM (
  'uploaded',
  'pending_review',
  'approved',
  'rejected'
);

-- 2. Columna last_updated_by en containers
ALTER TABLE public.containers
  ADD COLUMN IF NOT EXISTS last_updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. Tabla container_documents
CREATE TABLE public.container_documents (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id  uuid        NOT NULL REFERENCES public.containers(id) ON DELETE CASCADE,
  company_id    uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category      text        NOT NULL,
  file_name     text        NOT NULL,
  file_url      text        NOT NULL,
  doc_status    public.doc_status NOT NULL DEFAULT 'uploaded',
  comments      text,
  uploaded_by   uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_by   uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 4. Indexes
CREATE INDEX idx_container_documents_container ON public.container_documents(container_id);
CREATE INDEX idx_container_documents_company   ON public.container_documents(company_id);
CREATE INDEX idx_container_documents_category  ON public.container_documents(category);
CREATE INDEX idx_container_documents_status    ON public.container_documents(doc_status);

-- 5. RLS
ALTER TABLE public.container_documents ENABLE ROW LEVEL SECURITY;

-- Helpers already exist: my_company_id(), my_role()

-- SELECT: own company
CREATE POLICY "container_documents_select"
  ON public.container_documents
  FOR SELECT
  USING (company_id = my_company_id());

-- INSERT: operator+ (operator, director, super_admin)
CREATE POLICY "container_documents_insert"
  ON public.container_documents
  FOR INSERT
  WITH CHECK (
    company_id = my_company_id()
    AND my_role() IN ('operator', 'director', 'super_admin')
  );

-- UPDATE: operator or super_admin (e.g. approve/reject)
CREATE POLICY "container_documents_update"
  ON public.container_documents
  FOR UPDATE
  USING (company_id = my_company_id())
  WITH CHECK (
    company_id = my_company_id()
    AND my_role() IN ('operator', 'director', 'super_admin')
  );

-- DELETE: super_admin only
CREATE POLICY "container_documents_delete"
  ON public.container_documents
  FOR DELETE
  USING (
    company_id = my_company_id()
    AND my_role() = 'super_admin'
  );
