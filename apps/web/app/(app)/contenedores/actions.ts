'use server'
import { createClient } from '@/lib/supabase/server'
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
