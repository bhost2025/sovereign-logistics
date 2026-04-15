import { useEffect, useState } from 'react'
import { Stack, router, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const segments = useSegments()

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listener de cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return // todavía cargando

    const inAuth = segments[0] === '(auth)'

    if (!session && !inAuth) {
      router.replace('/(auth)/login')
    } else if (session && inAuth) {
      router.replace('/(tabs)')
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
