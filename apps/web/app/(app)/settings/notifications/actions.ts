'use server'
import { createClient } from '@/lib/supabase/server'
import { requireCan } from '@/lib/auth/can'
import { revalidatePath } from 'next/cache'

export async function updateNotificationSetting(
  eventType: string,
  formData: FormData,
) {
  await requireCan('manage_notifications')
  const supabase = await createClient()

  const enabled        = formData.get('enabled') === 'true'
  const push_enabled   = formData.get('push_enabled') === 'true'
  const days_threshold = formData.get('days_threshold')
    ? parseInt(formData.get('days_threshold') as string, 10)
    : null
  const roles = formData.getAll('notify_roles') as string[]

  await (supabase as any)
    .from('notification_settings')
    .update({ enabled, push_enabled, notify_roles: roles, days_threshold })
    .eq('event_type', eventType)

  revalidatePath('/settings/notifications')
}
