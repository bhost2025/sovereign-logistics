'use server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { writeLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveRolePermissions(
  role: string,
  permissions: Record<string, boolean>,
) {
  const profile = await getUserProfile()
  if (profile.role !== 'super_admin') redirect('/403')

  const supabase = await createClient()

  const upserts = Object.entries(permissions).map(([permission, granted]) => ({
    company_id:  profile.company_id,
    role,
    permission,
    granted,
    updated_by:  profile.id,
    updated_at:  new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('role_permissions')
    .upsert(upserts, { onConflict: 'company_id,role,permission' }) as any

  if (error) throw error

  await writeLog({
    action:       'permission_change',
    entity_type:  'role_permission',
    entity_label: role,
    changes: { permissions: { before: null, after: permissions } },
  })

  revalidatePath('/settings/roles')
}
