'use server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { writeLog } from '@/lib/audit'
import { redirect } from 'next/navigation'

export async function runSystemCleanup(formData: FormData) {
  const profile = await getUserProfile()
  if (profile.role !== 'super_admin') redirect('/403')

  const confirmWord = formData.get('confirm_word') as string
  const checkboxConfirm = formData.get('i_understand') === 'on'

  // Validate both confirmation steps
  if (confirmWord !== 'BORRAR TODO' && confirmWord !== 'DELETE ALL' && confirmWord !== '全部删除') {
    redirect('/settings/cleanup?error=word')
  }
  if (!checkboxConfirm) {
    redirect('/settings/cleanup?error=checkbox')
  }

  const supabase = await createClient()

  // Count entities before deletion for the log
  const [contRes, clientRes] = await Promise.all([
    (supabase as any).from('containers').select('id', { count: 'exact', head: true }).eq('company_id', profile.company_id),
    (supabase as any).from('clients').select('id', { count: 'exact', head: true }).eq('company_id', profile.company_id),
  ])
  const containerCount = contRes.count ?? 0
  const clientCount    = clientRes.count ?? 0

  // Soft-delete operational data in correct FK order
  const now = new Date().toISOString()

  // 1. Soft-delete invoices (cascade via containers)
  await (supabase as any)
    .from('invoices')
    .update({ deleted_at: now })
    .in(
      'container_id',
      (supabase as any)
        .from('containers')
        .select('id')
        .eq('company_id', profile.company_id)
    )

  // 2. Soft-delete all containers
  await (supabase as any)
    .from('containers')
    .update({ deleted_at: now })
    .eq('company_id', profile.company_id)

  // 3. Soft-delete all clients
  await (supabase as any)
    .from('clients')
    .update({ deleted_at: now })
    .eq('company_id', profile.company_id)

  // Log the cleanup event
  await writeLog({
    action:       'cleanup',
    entity_type:  'system',
    entity_label: 'System cleanup',
    changes: {
      containers_deleted: { before: containerCount, after: 0 },
      clients_deleted:    { before: clientCount,    after: 0 },
    },
  })

  redirect('/settings/cleanup?done=1')
}
