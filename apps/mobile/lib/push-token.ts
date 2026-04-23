import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { supabase } from './supabase'

/**
 * Requests notification permission, gets the Expo push token,
 * and upserts it into the device_tokens table.
 *
 * Call this after the user session is confirmed.
 * Never throws — failures are logged but do not break the app.
 */
export async function registerPushToken(): Promise<void> {
  try {
    // Push notifications only work on physical devices
    if (!Device.isDevice) return

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') return

    // Expo project ID is needed to get the push token
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId

    if (!projectId) {
      console.warn('[push] No EAS projectId found — skipping push token registration')
      return
    }

    const { data: tokenData } = await Notifications.getExpoPushTokenAsync({ projectId })
    const token = tokenData

    // Android notification channel (required on Android 8+)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0A1A3C',
      })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) return

    const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web'

    // Upsert — if the token already exists for this user, update the timestamp
    await (supabase as any)
      .from('device_tokens')
      .upsert(
        {
          user_id:    user.id,
          company_id: profile.company_id,
          token,
          platform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,token' }
      )

    console.log('[push] Token registered:', platform, token.slice(0, 30) + '…')
  } catch (err) {
    console.error('[push] Failed to register push token:', err)
  }
}
