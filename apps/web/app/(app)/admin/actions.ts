'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function requireSuperAdmin() {
  const profile = await getUserProfile()
  if (profile.role !== 'super_admin') redirect('/tablero')
  return profile
}

export async function createUserAction(formData: FormData) {
  const profile = await requireSuperAdmin()
  const admin = createAdminClient()

  const email     = (formData.get('email') as string).trim().toLowerCase()
  const password  = formData.get('password') as string
  const fullName  = (formData.get('full_name') as string).trim()
  const role      = formData.get('role') as string
  const language  = (formData.get('language') as string) || 'es'

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    redirect('/admin/usuarios/nuevo?error=auth')
  }

  // Insert profile
  const { error: profileError } = await (admin as any).from('users').insert({
    id:         authData.user.id,
    company_id: profile.company_id,
    full_name:  fullName,
    email,
    role,
    language,
  })

  if (profileError) {
    // Cleanup auth user if profile insert fails
    await admin.auth.admin.deleteUser(authData.user.id)
    redirect('/admin/usuarios/nuevo?error=profile')
  }

  revalidatePath('/admin/usuarios')
  redirect('/admin/usuarios')
}

export async function updateUserAction(formData: FormData) {
  await requireSuperAdmin()
  const supabase = await createClient()

  const userId   = formData.get('user_id') as string
  const fullName = (formData.get('full_name') as string).trim()
  const role     = formData.get('role') as string
  const isActive = formData.get('is_active') === 'true'
  const language = (formData.get('language') as string) || 'es'

  const { error } = await (supabase as any)
    .from('users')
    .update({ full_name: fullName, role, is_active: isActive, language })
    .eq('id', userId)

  if (error) redirect(`/admin/usuarios/${userId}?error=1`)

  revalidatePath('/admin/usuarios')
  redirect('/admin/usuarios')
}

export async function toggleUserActiveAction(userId: string, isActive: boolean) {
  await requireSuperAdmin()
  const supabase = await createClient()

  await supabase.from('users').update({ is_active: isActive }).eq('id', userId)

  revalidatePath('/admin/usuarios')
  redirect('/admin/usuarios')
}

export async function resetPasswordAction(formData: FormData) {
  await requireSuperAdmin()
  const admin = createAdminClient()

  const userId      = formData.get('user_id') as string
  const newPassword = (formData.get('new_password') as string).trim()

  if (newPassword.length < 8) redirect(`/admin/usuarios/${userId}?error=password`)

  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword })

  if (error) redirect(`/admin/usuarios/${userId}?error=reset`)

  redirect(`/admin/usuarios/${userId}?ok=reset`)
}

export async function deleteUserAction(formData: FormData) {
  const profile = await requireSuperAdmin()
  const admin   = createAdminClient()

  const userId = formData.get('user_id') as string

  // Prevent self-deletion
  if (userId === profile.id) redirect('/admin/usuarios?error=self')

  await admin.from('users').delete().eq('id', userId)
  await admin.auth.admin.deleteUser(userId)

  revalidatePath('/admin/usuarios')
  redirect('/admin/usuarios')
}
