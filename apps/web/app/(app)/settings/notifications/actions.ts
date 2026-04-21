'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateNotificationSetting(
  eventType: string,
  _formData: FormData,
) {
  const supabase = await createClient()
  const enabled        = _formData.get('enabled') === 'true'
  const days_threshold = _formData.get('days_threshold')
    ? parseInt(_formData.get('days_threshold') as string, 10)
    : null
  // Collect notify_roles from checkboxes
  const roles = _formData.getAll('notify_roles') as string[]

  await supabase
    .from('notification_settings')
    .update({
      enabled,
      notify_roles: roles,
      days_threshold,
    } as any)
    .eq('event_type', eventType)

  revalidatePath('/settings/notifications')
}
