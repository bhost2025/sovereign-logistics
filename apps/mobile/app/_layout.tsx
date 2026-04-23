import { useEffect, useRef, useState } from 'react'
import { Stack, router, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import * as Notifications from 'expo-notifications'
import { supabase } from '../lib/supabase'
import { registerPushToken } from '../lib/push-token'
import type { Session } from '@supabase/supabase-js'

// Show notifications while the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const segments = useSegments()
  const notificationListener = useRef<Notifications.EventSubscription>()
  const responseListener = useRef<Notifications.EventSubscription>()

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listener de cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // Foreground notification received (no navigation, just display)
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Handler is set above — nothing extra needed here
    })

    // User tapped a notification — navigate to the container
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>
      if (data?.containerId && typeof data.containerId === 'string') {
        router.push(`/(tabs)/contenedor/${data.containerId}` as any)
      }
    })

    return () => {
      subscription.unsubscribe()
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [])

  useEffect(() => {
    if (session === undefined) return // todavía cargando

    const inAuth = segments[0] === '(auth)'

    if (!session && !inAuth) {
      router.replace('/(auth)/login')
    } else if (session && inAuth) {
      router.replace('/(tabs)')
    }

    // Register push token whenever a session is established
    if (session) {
      registerPushToken()
    }
  }, [session, segments])

  // Splash mientras se resuelve la sesión
  if (session === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A1A3C', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#F1F5F9" size="large" />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}
