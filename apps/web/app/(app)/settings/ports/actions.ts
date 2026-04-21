'use server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { revalidatePath } from 'next/cache'

export async function createPort(formData: FormData) {
  const profile = await getUserProfile()
  const supabase = await createClient()

  const name    = formData.get('name')    as string
  const country = formData.get('country') as string
  const code    = formData.get('code')    as string
  const type    = formData.get('type')    as string

  if (!name || !country || !type) throw new Error('Campos requeridos faltantes')

  await supabase.from('ports').insert({
    company_id: profile.company_id,
    name: name.trim(),
    country,
    code: code?.trim() || null,
    type,
    active: true,
  } as any)

  revalidatePath('/settings/ports')
}

export async function togglePort(portId: string, active: boolean, _formData: FormData) {
  await (await createClient()).from('ports').update({ active } as any).eq('id', portId)
  revalidatePath('/settings/ports')
}

export async function deletePort(portId: string, _formData: FormData) {
  await (await createClient()).from('ports').delete().eq('id', portId)
  revalidatePath('/settings/ports')
}
