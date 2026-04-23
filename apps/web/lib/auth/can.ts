import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'

const SUPER_ADMIN_ROLE = 'super_admin'

/**
 * Check if the current user has a given permission.
 * super_admin always returns true.
 * All other roles check the role_permissions table.
 */
export async function can(permission: string): Promise<boolean> {
  try {
    const profile = await getUserProfile()
    if (!profile) return false
    if (profile.role === SUPER_ADMIN_ROLE) return true

    const supabase = await createClient()
    const { data } = await (supabase as any)
      .from('role_permissions')
      .select('granted')
      .eq('company_id', profile.company_id)
      .eq('role', profile.role)
      .eq('permission', permission)
      .single()

    return data?.granted === true
  } catch {
    return false
  }
}

/**
 * Assert the current user has a permission.
 * Throws a Response-like error that Next.js will display as a 403.
 */
export async function requireCan(permission: string): Promise<void> {
  const allowed = await can(permission)
  if (!allowed) {
    const { redirect } = await import('next/navigation')
    redirect('/403')
  }
}
