import { createClient } from '@/lib/supabase/server'
import { DOCUMENT_CATEGORIES } from './documents-config'

export type { DocStatus } from './documents-config'
export { DOCUMENT_CATEGORIES, DOC_STATUS_CONFIG } from './documents-config'

export type ContainerDocument = {
  id: string
  container_id: string
  company_id: string
  category: string
  file_name: string
  file_url: string
  doc_status: import('./documents-config').DocStatus
  comments: string | null
  uploaded_by: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  uploader?: { full_name: string } | null
  reviewer?: { full_name: string } | null
}

export async function getContainerDocuments(containerId: string): Promise<ContainerDocument[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('container_documents')
    .select(`
      *,
      uploader:uploaded_by(full_name),
      reviewer:reviewed_by(full_name)
    `)
    .eq('container_id', containerId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}

export function groupDocumentsByCategory(docs: ContainerDocument[]) {
  return DOCUMENT_CATEGORIES.map(cat => ({
    ...cat,
    documents: docs.filter(d => d.category === cat.slug),
  }))
}

export function getMissingRequiredCategories(docs: ContainerDocument[]) {
  const uploadedCategories = new Set(docs.map(d => d.category))
  return DOCUMENT_CATEGORIES.filter(
    cat => cat.required && !uploadedCategories.has(cat.slug)
  )
}
