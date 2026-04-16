'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function setLocaleAction(formData: FormData) {
  const supabase = await createClient()
  const profile  = await getUserProfile()
  const locale   = formData.get('locale') as string
  const userId   = formData.get('user_id') as string

  if (!['es', 'en', 'zh'].includes(locale)) redirect('/')

  // Save in DB
  await supabase.from('users').update({ language: locale } as any).eq('id', userId)

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set('locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })

  // Redirect back to the same page
  const headerStore = await headers()
  const referer = headerStore.get('referer') ?? '/tablero'

  revalidatePath('/', 'layout')
  redirect(referer)
}
