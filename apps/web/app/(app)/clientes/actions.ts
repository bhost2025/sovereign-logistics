'use server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { requireCan } from '@/lib/auth/can'
import { writeLog, diffObjects } from '@/lib/audit'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createClientAction(formData: FormData) {
  await requireCan('create_clients')
  const supabase = await createClient()
  const profile = await getUserProfile()

  const { error, data } = await supabase
    .from('clients')
    .insert({
      company_id:   profile.company_id,
      name:         (formData.get('name') as string).trim(),
      contact_name: (formData.get('contact_name') as string)?.trim() || null,
      email:        (formData.get('email') as string)?.trim() || null,
      phone:        (formData.get('phone') as string)?.trim() || null,
    })
    .select()
    .single()

  if (error) redirect('/clientes/nuevo?error=1')

  await writeLog({
    action:       'create',
    entity_type:  'client',
    entity_id:    data.id,
    entity_label: data.name,
  })

  redirect(`/clientes/${data.id}`)
}

export async function updateClientAction(clientId: string, formData: FormData) {
  await requireCan('edit_clients')
  const supabase = await createClient()

  const { data: before } = await supabase
    .from('clients')
    .select('name, contact_name, email, phone')
    .eq('id', clientId)
    .single()

  const payload = {
    name:         (formData.get('name') as string).trim(),
    contact_name: (formData.get('contact_name') as string)?.trim() || null,
    email:        (formData.get('email') as string)?.trim() || null,
    phone:        (formData.get('phone') as string)?.trim() || null,
  }

  const { error } = await supabase
    .from('clients')
    .update(payload)
    .eq('id', clientId)

  if (error) redirect(`/clientes/${clientId}/editar?error=1`)

  await writeLog({
    action:       'update',
    entity_type:  'client',
    entity_id:    clientId,
    entity_label: payload.name,
    changes:      diffObjects(before as any ?? {}, payload as any),
  })

  revalidatePath(`/clientes/${clientId}`)
  redirect(`/clientes/${clientId}`)
}

export async function deleteClientAction(clientId: string) {
  await requireCan('delete_clients')
  const supabase = await createClient()

  // Dependency check: block if client has active containers
  const { count } = await supabase
    .from('container_clients')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId) as any

  if ((count ?? 0) > 0) {
    redirect(`/clientes/${clientId}?error=has_containers&count=${count}`)
  }

  const { data: client } = await supabase
    .from('clients')
    .select('name')
    .eq('id', clientId)
    .single()

  await (supabase as any)
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', clientId)

  await writeLog({
    action:       'delete',
    entity_type:  'client',
    entity_id:    clientId,
    entity_label: client?.name ?? clientId,
  })

  revalidatePath('/clientes')
  redirect('/clientes')
}
