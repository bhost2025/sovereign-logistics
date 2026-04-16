'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { redirect } from 'next/navigation'

export async function createClientAction(formData: FormData) {
  const supabase = await createClient()
  const profile = await getUserProfile()

  const { error, data } = await supabase
    .from('clients')
    .insert({
      company_id:   profile.company_id,
      name:         formData.get('name') as string,
      contact_name: formData.get('contact_name') as string || null,
      email:        formData.get('email') as string || null,
      phone:        formData.get('phone') as string || null,
    })
    .select()
    .single()

  if (error) redirect('/clientes/nuevo?error=1')
  redirect(`/clientes/${data.id}`)
}
