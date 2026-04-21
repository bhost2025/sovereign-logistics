'use server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { revalidatePath } from 'next/cache'

export async function createAgency(formData: FormData) {
  const profile = await getUserProfile()
  const supabase = await createClient()

  const name           = formData.get('name')           as string
  const type           = formData.get('type')           as string
  const contact_name   = formData.get('contact_name')   as string
  const contact_email  = formData.get('contact_email')  as string
  const contact_phone  = formData.get('contact_phone')  as string
  const specialization = formData.get('specialization') as string
  const notes          = formData.get('notes')          as string

  if (!name || !type) throw new Error('Campos requeridos faltantes')

  await supabase.from('agencies').insert({
    company_id:    profile.company_id,
    name:          name.trim(),
    type,
    contact_name:  contact_name?.trim()   || null,
    contact_email: contact_email?.trim()  || null,
    contact_phone: contact_phone?.trim()  || null,
    specialization: specialization?.trim() || null,
    notes:         notes?.trim()          || null,
    active:        true,
  } as any)

  revalidatePath('/settings/agencies')
}

export async function toggleAgency(agencyId: string, active: boolean, _formData: FormData) {
  await (await createClient()).from('agencies').update({ active } as any).eq('id', agencyId)
  revalidatePath('/settings/agencies')
}

export async function deleteAgency(agencyId: string, _formData: FormData) {
  await (await createClient()).from('agencies').delete().eq('id', agencyId)
  revalidatePath('/settings/agencies')
}
