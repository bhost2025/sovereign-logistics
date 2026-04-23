'use server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { writeLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateCompanyAction(formData: FormData) {
  const profile = await getUserProfile()
  if (profile.role !== 'super_admin') redirect('/403')

  const name     = (formData.get('name') as string)?.trim()
  const logo_url = (formData.get('logo_url') as string)?.trim() || null

  if (!name) redirect('/settings/empresa?error=name_required')

  const supabase = await createClient()

  const { data: before } = await supabase
    .from('companies')
    .select('name, logo_url')
    .eq('id', profile.company_id)
    .single()

  const { error } = await supabase
    .from('companies')
    .update({ name, logo_url })
    .eq('id', profile.company_id)

  if (error) redirect('/settings/empresa?error=save_failed')

  await writeLog({
    action:       'update',
    entity_type:  'system',
    entity_label: 'company',
    changes: {
      name:     { before: before?.name     ?? null, after: name },
      logo_url: { before: before?.logo_url ?? null, after: logo_url },
    },
  })

  revalidatePath('/settings/empresa')
  redirect('/settings/empresa?saved=1')
}
