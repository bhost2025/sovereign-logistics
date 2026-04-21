'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addProduct(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id, company_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const containerId    = formData.get('container_id') as string
  const clientId       = formData.get('client_id') as string
  const description    = (formData.get('description') as string).trim()
  const sku            = (formData.get('sku') as string)?.trim() || null
  const quantity       = Number(formData.get('quantity') ?? 1)
  const unit           = (formData.get('unit') as string)?.trim() || null
  const declaredValue  = formData.get('declared_value') ? Number(formData.get('declared_value')) : null
  const currency       = (formData.get('currency') as string) || 'USD'
  const invoiceId      = (formData.get('invoice_id') as string) || null

  if (!description || !containerId || !clientId) {
    redirect(`/contenedores/${containerId}?tab=info&error=missing_fields`)
  }

  await (supabase as any).from('container_products').insert({
    container_id:    containerId,
    client_id:       clientId,
    company_id:      profile.company_id,
    invoice_id:      invoiceId,
    sku,
    description,
    quantity,
    unit,
    declared_value:  declaredValue,
    currency,
  })

  revalidatePath(`/contenedores/${containerId}`)
}

export async function deleteProduct(productId: string, containerId: string, _formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await (supabase as any)
    .from('container_products')
    .delete()
    .eq('id', productId)

  revalidatePath(`/contenedores/${containerId}`)
}
