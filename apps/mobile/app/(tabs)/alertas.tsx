import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import DrawerMenu from '../../components/DrawerMenu'

type Alert = {
  id: string
  container_number: string
  current_status: string
  updated_at: string
  type: 'detained' | 'stale'
  client: string
}

const STALE_DAYS = 5

export default function AlertasScreen() {
  const [alerts, setAlerts]     = useState<Alert[]>([])
  const [profile, setProfile]   = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: p } = await supabase.from('users').select('*').eq('id', user.id).single()
      setProfile(p)
    }

    const staleThreshold = new Date()
    staleThreshold.setDate(staleThreshold.getDate() - STALE_DAYS)

    const { data: containers } = await supabase
      .from('containers')
      .select('id, container_number, current_status, updated_at, container_clients(clients(name))')
      .neq('current_status', 'entregado')

    const result: Alert[] = []

    for (const c of containers ?? []) {
      const client = (c as any).container_clients?.[0]?.clients?.name ?? '—'

      if (c.current_status === 'detenido_aduana') {
        result.push({ id: c.id, container_number: c.container_number, current_status: c.current_status, updated_at: c.updated_at, type: 'detained', client })
      } else if (new Date(c.updated_at) < staleThreshold) {
        result.push({ id: c.id, container_number: c.container_number, current_status: c.current_status, updated_at: c.updated_at, type: 'stale', client })
      }
    }

    // Detained first
    result.sort((a, b) => {
      if (a.type === 'detained' && b.type !== 'detained') return -1
      if (b.type === 'detained' && a.type !== 'detained') return 1
      return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
    })

    setAlerts(result)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <View style={s.center}><ActivityIndicator color="#0A1A3C" /></View>

  return (
    <>
      <FlatList
        style={s.root}
        data={alerts}
        keyExtractor={a => a.id + a.type}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
        ListHeaderComponent={
          <View style={s.header}>
            <TouchableOpacity onPress={() => setDrawerOpen(true)} style={s.hamburger} activeOpacity={0.7}>
              <View style={s.hLine} />
              <View style={[s.hLine, { width: 16 }]} />
              <View style={s.hLine} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Alertas</Text>
            {alerts.length > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{alerts.length}</Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const isDetained = item.type === 'detained'
          const accentColor = isDetained ? '#C05A00' : '#B8860B'
          const daysSince = Math.floor((Date.now() - new Date(item.updated_at).getTime()) / 86400000)

          return (
            <TouchableOpacity
              style={[s.card, { borderLeftColor: accentColor }]}
              onPress={() => router.push(`/contenedor/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={s.cardTop}>
                <View style={[s.typeBadge, { backgroundColor: accentColor + '18' }]}>
                  <Text style={[s.typeBadgeText, { color: accentColor }]}>
                    {isDetained ? '◆ Detenido' : '◈ Sin actualizar'}
                  </Text>
                </View>
                <Text style={s.num}>{item.container_number}</Text>
              </View>
              <Text style={s.client}>{item.client}</Text>
              <Text style={[s.detail, { color: accentColor }]}>
                {isDetained
                  ? 'Detenido en Aduana — acción requerida'
                  : `Sin actualizar hace ${daysSince} días`
                }
              </Text>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>◎</Text>
            <Text style={s.emptyTitle}>Sin alertas activas</Text>
            <Text style={s.emptySub}>Todos los contenedores están al día</Text>
          </View>
        }
      />

      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} profile={profile} />
    </>
  )
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f7fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12, gap: 12 },
  hamburger:  { gap: 4, padding: 4, backgroundColor: '#0A1A3C', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  hLine:      { width: 18, height: 2, backgroundColor: '#F1F5F9', borderRadius: 1 },
  headerTitle:{ flex: 1, fontSize: 16, fontWeight: '800', color: '#0a1a3c', letterSpacing: -0.3 },
  badge: { backgroundColor: '#C05A00', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  card:   { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderLeftWidth: 4, shadowColor: '#0a1a3c', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  num:    { fontSize: 13, fontWeight: '800', color: '#0a1a3c' },
  client: { fontSize: 11, color: '#6b7a8a', fontWeight: '600', marginBottom: 4 },
  detail: { fontSize: 10, fontWeight: '700' },
  empty:  { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon:  { fontSize: 36, color: '#c5c6cf' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0a1a3c' },
  emptySub:   { fontSize: 12, color: '#8a9aaa' },
})
