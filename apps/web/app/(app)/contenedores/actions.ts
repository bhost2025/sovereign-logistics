'use server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { requireCan } from '@/lib/auth/can'
import { writeLog, diffObjects } from '@/lib/audit'
import { dispatchNotification } from '@/lib/notifications'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Database } from '@sovereign/db'

type ContainerStatus = Database['public']['Enums']['container_status']

export async function createContainer(formData: FormData) {
  await requireCan('create_containers')
  const profile = await getUserProfile()
  const supabase = await createClient()

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
  }).select('id, container_number').single()

  if (error) redirect('/contenedores/nuevo?error=1')

  await supabase.from('container_status_log').insert({
    container_id:    data.id,
    previous_status: null,
    new_status:      'en_puerto_origen',
    changed_by:      profile.id,
    notes:           'Contenedor registrado',
  })

  await writeLog({
    action:       'create',
    entity_type:  'container',
    entity_id:    data.id,
    entity_label: data.container_number,
  })

  revalidatePath('/tablero')
  revalidatePath('/contenedores')
  redirect(`/contenedores/${data.id}`)
}

export async function updateContainer(containerId: string, formData: FormData) {
  await requireCan('edit_containers')
  const profile = await getUserProfile()
  const supabase = await createClient()

  // Snapshot before
  const { data: before } = await supabase
    .from('containers')
    .select('container_number,bl_number,origin_port,destination_port,departure_date,eta_date,arrival_date,notes,current_status')
    .eq('id', containerId)
    .single()

  const payload = {
    bl_number:        (formData.get('bl_number') as string)?.trim() || null,
    origin_port:      (formData.get('origin_port') as string).trim(),
    destination_port: (formData.get('destination_port') as string).trim(),
    departure_date:   (formData.get('departure_date') as string) || null,
    eta_date:         (formData.get('eta_date') as string) || null,
    arrival_date:     (formData.get('arrival_date') as string) || null,
    notes:            (formData.get('notes') as string)?.trim() || null,
    updated_at:       new Date().toISOString(),
    last_updated_by:  profile.id,
  }

  const { error } = await supabase
    .from('containers')
    .update(payload)
    .eq('id', containerId)

  if (error) redirect(`/contenedores/${containerId}/editar?error=1`)

  await writeLog({
    action:       'update',
    entity_type:  'container',
    entity_id:    containerId,
    entity_label: before?.container_number ?? containerId,
    changes:      diffObjects(before as any ?? {}, payload as any),
  })

  revalidatePath(`/contenedores/${containerId}`)
  revalidatePath('/tablero')
  redirect(`/contenedores/${containerId}`)
}

export async function softDeleteContainer(containerId: string) {
  await requireCan('delete_containers')
  const profile = await getUserProfile()
  const supabase = await createClient()

  const { data: container } = await supabase
    .from('containers')
    .select('container_number')
    .eq('id', containerId)
    .single()

  await (supabase as any)
    .from('containers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', containerId)

  await writeLog({
    action:       'delete',
    entity_type:  'container',
    entity_id:    containerId,
    entity_label: container?.container_number ?? containerId,
  })

  revalidatePath('/tablero')
  revalidatePath('/contenedores')
  redirect('/contenedores')
}

export async function restoreContainer(containerId: string) {
  await requireCan('delete_containers')
  const supabase = await createClient()

  const { data: container } = await (supabase as any)
    .from('containers')
    .select('container_number')
    .eq('id', containerId)
    .single()

  await (supabase as any)
    .from('containers')
    .update({ deleted_at: null })
    .eq('id', containerId)

  await writeLog({
    action:       'restore',
    entity_type:  'container',
    entity_id:    containerId,
    entity_label: container?.container_number ?? containerId,
  })

  revalidatePath(`/contenedores/${containerId}`)
  redirect(`/contenedores/${containerId}`)
}

export async function updateContainerStatus(
  containerId: string,
  newStatus: ContainerStatus,
  notes: string,
) {
  await requireCan('edit_containers')
  const profile = await getUserProfile()
  const supabase = await createClient()

  const { data: current } = await supabase
    .from('containers')
    .select('current_status, container_number, eta_date')
    .eq('id', containerId)
    .single()

  await supabase.from('containers').update({
    current_status:  newStatus,
    updated_at:      new Date().toISOString(),
    last_updated_by: profile.id,
  }).eq('id', containerId)

  await supabase.from('container_status_log').insert({
    container_id:    containerId,
    previous_status: current?.current_status ?? null,
    new_status:      newStatus,
    changed_by:      profile.id,
    notes:           notes || null,
  })

  await writeLog({
    action:       'update',
    entity_type:  'container',
    entity_id:    containerId,
    entity_label: current?.container_number ?? containerId,
    changes: {
      current_status: {
        before: current?.current_status,
        after:  newStatus,
      },
    },
  })

  // Dispatch email notification if status is critical
  if (newStatus === 'detenido_aduana') {
    await dispatchNotification('container_detained', {
      containerId,
      containerNumber: current?.container_number ?? containerId,
      status: newStatus,
      companyId: profile.company_id,
    })
  }

  revalidatePath(`/contenedores/${containerId}`)
  revalidatePath('/tablero')
  redirect(`/contenedores/${containerId}`)
}

export async function addClientToContainer(formData: FormData) {
  await requireCan('edit_containers')
  const supabase = await createClient()

  const containerId = formData.get('container_id') as string
  const clientId    = formData.get('client_id') as string
  const sharePct    = formData.get('share_pct') ? Number(formData.get('share_pct')) : null

  const { error } = await supabase.from('container_clients').insert({
    container_id: containerId,
    client_id:    clientId,
    share_pct:    sharePct,
  })

  if (error) redirect(`/contenedores/${containerId}/agregar-cliente?error=1`)

  await writeLog({
    action:       'update',
    entity_type:  'container',
    entity_id:    containerId,
    entity_label: containerId,
    changes: { client_added: { before: null, after: clientId } },
  })

  revalidatePath(`/contenedores/${containerId}`)
  redirect(`/contenedores/${containerId}`)
}

export async function createInvoiceAction(formData: FormData) {
  await requireCan('create_invoices')
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
    .insert({ container_id: containerId, client_id: clientId, invoice_number: invoiceNumber, currency, declared_value: declaredValue, description })
    .select('id')
    .single()

  if (error) redirect(`/contenedores/${containerId}/facturas/nueva?error=1`)

  const count = Number(formData.get('items_count') ?? 0)
  const items: any[] = []
  for (let i = 0; i < count; i++) {
    const desc  = (formData.get(`items[${i}][description]`) as string)?.trim()
    const qty   = Number(formData.get(`items[${i}][quantity]`))
    const unit  = (formData.get(`items[${i}][unit]`) as string)?.trim() || null
    const price = Number(formData.get(`items[${i}][unit_price]`))
    if (desc) items.push({ invoice_id: invoice.id, description: desc, quantity: qty || 1, unit, unit_price: price || 0 })
  }
  if (items.length > 0) await supabase.from('invoice_items').insert(items)

  await writeLog({
    action:       'create',
    entity_type:  'invoice',
    entity_id:    invoice.id,
    entity_label: invoiceNumber,
    changes: { container_id: { before: null, after: containerId } },
  })

  revalidatePath(`/contenedores/${containerId}`)
  redirect(`/contenedores/${containerId}`)
}

export async function updateInvoiceAction(invoiceId: string, containerId: string, formData: FormData) {
  await requireCan('create_invoices')
  const supabase = await createClient() as any

  const { data: before } = await supabase
    .from('invoices')
    .select('invoice_number, currency, declared_value, description, status')
    .eq('id', invoiceId)
    .single()

  const payload = {
    invoice_number: (formData.get('invoice_number') as string).trim(),
    currency:       (formData.get('currency') as string) || 'USD',
    declared_value: formData.get('declared_value') ? Number(formData.get('declared_value')) : null,
    description:    (formData.get('description') as string)?.trim() || null,
    status:         (formData.get('status') as string) || 'pendiente',
  }

  const { error } = await supabase
    .from('invoices')
    .update(payload)
    .eq('id', invoiceId)

  if (error) redirect(`/contenedores/${containerId}/facturas/${invoiceId}/editar?error=1`)

  // Replace all items
  await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)

  const count = Number(formData.get('items_count') ?? 0)
  const items: any[] = []
  for (let i = 0; i < count; i++) {
    const desc  = (formData.get(`items[${i}][description]`) as string)?.trim()
    const qty   = Number(formData.get(`items[${i}][quantity]`))
    const unit  = (formData.get(`items[${i}][unit]`) as string)?.trim() || null
    const price = Number(formData.get(`items[${i}][unit_price]`))
    if (desc) items.push({ invoice_id: invoiceId, description: desc, quantity: qty || 1, unit, unit_price: price || 0 })
  }
  if (items.length > 0) await supabase.from('invoice_items').insert(items)

  await writeLog({
    action:       'update',
    entity_type:  'invoice',
    entity_id:    invoiceId,
    entity_label: payload.invoice_number,
    changes:      diffObjects(before ?? {}, payload),
  })

  revalidatePath(`/contenedores/${containerId}`)
  redirect(`/contenedores/${containerId}`)
}

export async function deleteInvoiceAction(invoiceId: string, containerId: string) {
  await requireCan('delete_invoices')
  const supabase = await createClient() as any

  const { data: invoice } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('id', invoiceId)
    .single()

  await supabase.from('invoices').update({ deleted_at: new Date().toISOString() }).eq('id', invoiceId)

  await writeLog({
    action:       'delete',
    entity_type:  'invoice',
    entity_id:    invoiceId,
    entity_label: invoice?.invoice_number ?? invoiceId,
  })

  revalidatePath(`/contenedores/${containerId}`)
  redirect(`/contenedores/${containerId}`)
}
