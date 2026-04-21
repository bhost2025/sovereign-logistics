'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function uploadDocument(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id, company_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const containerId = formData.get('container_id') as string
  const category    = formData.get('category') as string
  const comments    = (formData.get('comments') as string)?.trim() || null
  const file        = formData.get('file') as File | null

  if (!file || !containerId || !category) {
    redirect(`/contenedores/${containerId}?tab=documentos&error=missing_fields`)
  }

  // Upload to Supabase Storage
  const ext      = file.name.split('.').pop()
  const fileName = `${containerId}/${category}/${Date.now()}.${ext}`
  const bytes    = await file.arrayBuffer()

  const { error: storageError } = await supabase.storage
    .from('container-docs')
    .upload(fileName, bytes, {
      contentType: file.type,
      upsert: false,
    })

  if (storageError) {
    redirect(`/contenedores/${containerId}?tab=documentos&error=upload_failed`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from('container-docs')
    .getPublicUrl(fileName)

  // Insert document record
  const { error: dbError } = await (supabase as any)
    .from('container_documents')
    .insert({
      container_id: containerId,
      company_id:   profile.company_id,
      category,
      file_name:    file.name,
      file_url:     publicUrl,
      doc_status:   'uploaded',
      comments,
      uploaded_by:  profile.id,
    })

  if (dbError) {
    redirect(`/contenedores/${containerId}?tab=documentos&error=db_error`)
  }

  revalidatePath(`/contenedores/${containerId}`)
  redirect(`/contenedores/${containerId}?tab=documentos`)
}

export async function updateDocumentStatus(
  documentId: string,
  containerId: string,
  newStatus: 'pending_review' | 'approved' | 'rejected',
  _formData: FormData,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id').eq('id', user.id).single()

  const update: Record<string, unknown> = {
    doc_status:  newStatus,
    reviewed_by: profile?.id ?? null,
    reviewed_at: new Date().toISOString(),
    updated_at:  new Date().toISOString(),
  }

  await (supabase as any)
    .from('container_documents')
    .update(update)
    .eq('id', documentId)

  revalidatePath(`/contenedores/${containerId}`)
  redirect(`/contenedores/${containerId}?tab=documentos`)
}

export async function deleteDocument(documentId: string, containerId: string, _formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch file_url first to also delete from storage
  const { data: doc } = await (supabase as any)
    .from('container_documents')
    .select('file_url, file_name')
    .eq('id', documentId)
    .single()

  if (doc) {
    // Extract storage path from URL
    const url = new URL(doc.file_url)
    const storagePath = url.pathname.split('/container-docs/')[1]
    if (storagePath) {
      await supabase.storage.from('container-docs').remove([storagePath])
    }
  }

  await (supabase as any)
    .from('container_documents')
    .delete()
    .eq('id', documentId)

  revalidatePath(`/contenedores/${containerId}`)
  redirect(`/contenedores/${containerId}?tab=documentos`)
}
