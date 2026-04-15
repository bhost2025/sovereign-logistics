import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Database } from '@sovereign/db'

export type UserProfile = Database['public']['Tables']['users']['Row']

export async function getUserProfile(): Promise<UserProfile> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) redirect('/login')
  return profile
}
