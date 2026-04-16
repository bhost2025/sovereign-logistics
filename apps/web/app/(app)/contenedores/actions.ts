'use server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Database } from '@sovereign/db'

type ContainerStatus = Database['public']['Enums']['container_status']

export async function createContainer(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('company_id, id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data, error } = await supabase.from('containers').insert({
    company_id:       profile.company_id,
    container_number: (formData.get('container_number') as string).trim().toUpperCase(),
    bl_number:        (formData.get('bl_number') as string)?.trim() || null,
    origin_port:      (formData.get('origin_port') as string).trim(),
    destination_port: (formData.get('destination_port') as string).trim(),
    departure_date:   (formData.get('departure_date') as string) || null,
    eta_date:         (formData.get('eta_date') as string) || null,
    notes:            (formData.get('notes') as string)?.trim() || null,
    created_by:       profile.id,
  }).select('id').single()

  if (error) redirect('/contenedores/nuevo?error=1')

  await supabase.from('container_status_log').insert({
    container_id:    data.id,
    previous_status: null,
    new_status:      'en_puerto_origen',
    changed_by:      profile.id,
    notes:           'Contenedor registrado',
  })

  revalidatePath('/tablero')
  revalidatePath('/contenedores')
  redirect(`/contenedores/${data.id}`)
}

export async function updateContainerStatus(containerId: string, newStatus: ContainerStatus, notes: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id').eq('id', user.id).single()

  const { data: current } = await supabase
    .from('containers').select('current_status').eq('id', containerId).single()

  await supabase.from('containers')
    .update({ current_status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', containerId)

  await supabase.from('container_status_log').insert({
    container_id:    containerId,
    previous_status: current?.current_status ?? null,
    new_status:      newStatus,
    changed_by:      profile?.id ?? null,
    notes:           notes || null,
  })

  revalidatePath(`/contenedores/${containerId}`)
  revalidatePath('/tablero')
  redirect(`/contenedores/${containerId}`)
}

export async function addClientToContainer(formData: FormData) {
  const supabase = await createClient()
  const profile = await getUserProfile()

  const containerId = formData.get('container_id') as string
  const clientId    = formData.get('client_id') as string
  const sharePct    = formData.get('share_pct') ? Number(formData.get('share_pct')) : null

  const { error } = await supabase.from('container_clients').insert({
    container_id: containerId,
    client_id:    clientId,
    share_pct:    sharePct,
  })

  if (error) redirect(`/contenedores/${containerId}/agregar-cliente?error=1`)
  revalidatePath(`/contenedores/${containerId}`)
  redirect(`/contenedores/${containerId}`)
}

export async function createInvoiceAction(formData: FormData) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  const profile = await getUserProfile()

  const containerId   = formData.get('container_id') as string
  const clientId      = formData.get('client_id') as string
  const invoiceNumber = (formData.get('invoice_number') as string).trim()
  const currency      = (formData.get('currency') as string) || 'USD'
  const declaredValue = formData.get('declared_value') ? Number(formData.get('declared_value')) : null
  const description   = (formData.get('description') as string)?.trim() || null

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      container_id:   containerId,
      client_id:      clientId,
      invoice_number: invoiceNumber,
      currency,
      declared_value: declaredValue,
      description,
    })
    .select('id')
    .single()

  if (error) redirect(`/contenedores/${containerId}/facturas/nueva?error=1`)

  // Insert items
  const count = Number(formData.get('items_count') ?? 0)
  const items: any[] = []
  for (let i = 0; i < count; i++) {
    const desc  = (formData.get(`items[${i}][description]`) as string)?.trim()
    const qty   = Number(formData.get(`items[${i}][quantity]`))
    const unit  = (formData.get(`items[${i}][unit]`) as string)?.trim() || null
    const price = Number(formData.get(`items[${i}][unit_price]`))
    if (desc) items.push({ invoice_id: invoice.id, description: desc, quantity: qty || 1, unit, unit_price: price || 0 })
  }
  if (items.length > 0) {
    await supabase.from('invoice_items').insert(items)
  }

  revalidatePath(`/contenedores/${containerId}`)
  redirect(`/contenedores/${containerId}`)
}
