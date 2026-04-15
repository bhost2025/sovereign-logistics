import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function PerfilScreen() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase.from('users').select('*').eq('id', user.id).single()
        .then(({ data }) => { setProfile(data); setLoading(false) })
    })
  }, [])

  async function handleSignOut() {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ])
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#0A1A3C" /></View>

  return (
    <View style={s.root}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>
          {profile?.full_name?.slice(0, 2).toUpperCase() ?? '??'}
        </Text>
      </View>
      <Text style={s.name}>{profile?.full_name ?? '—'}</Text>
      <Text style={s.role}>{profile?.role?.replace('_', ' ').toUpperCase() ?? '—'}</Text>
      <Text style={s.email}>{profile?.email ?? '—'}</Text>

      <TouchableOpacity style={s.signOut} onPress={handleSignOut} activeOpacity={0.8}>
        <Text style={s.signOutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#f7fafc', alignItems: 'center', justifyContent: 'center', padding: 32 },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatar:       { width: 72, height: 72, borderRadius: 36, backgroundColor: '#0A1A3C', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText:   { color: '#F1F5F9', fontSize: 22, fontWeight: '800' },
  name:         { fontSize: 20, fontWeight: '800', color: '#0A1A3C', marginBottom: 4 },
  role:         { fontSize: 10, fontWeight: '700', color: '#8a9aaa', letterSpacing: 1.5, marginBottom: 8 },
  email:        { fontSize: 13, color: '#6b7a8a', marginBottom: 40 },
  signOut:      { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, borderWidth: 1, borderColor: '#e8ebee' },
  signOutText:  { fontSize: 13, fontWeight: '700', color: '#C05A00' },
})
