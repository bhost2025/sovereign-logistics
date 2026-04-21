import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import DrawerMenu from '../../components/DrawerMenu'

type Container = {
  id: string
  container_number: string
  origin_port: string
  destination_port: string
  current_status: string
  eta_date: string | null
  container_clients: { clients: { name: string } | null }[]
}

const STATUS_COLOR: Record<string, string> = {
  en_puerto_origen:     '#556479',
  zarpo:                '#4A6FA5',
  en_transito_maritimo: '#4A6FA5',
  eta_puerto_destino:   '#4A6FA5',
  en_aduana:            '#B8860B',
  liberado_aduana:      '#1A7A8A',
  detenido_aduana:      '#C05A00',
  transito_terrestre:   '#7A6A00',
  entregado:            '#1A7A8A',
}

const STATUS_LABEL: Record<string, string> = {
  en_puerto_origen:     'Puerto Origen',
  zarpo:                'Zarpó',
  en_transito_maritimo: 'En Tránsito',
  eta_puerto_destino:   'ETA Puerto',
  en_aduana:            'En Aduana',
  liberado_aduana:      'Liberado ✓',
  detenido_aduana:      'Detenido ▲',
  transito_terrestre:   'T. Terrestre',
  entregado:            'Entregado',
}

export default function ContenedoresScreen() {
  const [containers, setContainers] = useState<Container[]>([])
  const [filtered, setFiltered]     = useState<Container[]>([])
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [profile, setProfile]       = useState<any>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: p } = await supabase.from('users').select('*').eq('id', user.id).single()
      setProfile(p)
    }

    const { data } = await supabase
      .from('containers')
      .select('id, container_number, origin_port, destination_port, current_status, eta_date, container_clients(clients(name))')
      .order('updated_at', { ascending: false })
    setContainers(data ?? [])
    setFiltered(data ?? [])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { load() }, [load])

  function onSearch(text: string) {
    setSearch(text)
    const q = text.toLowerCase()
    setFiltered(containers.filter(c =>
      c.container_number.toLowerCase().includes(q) ||
      c.container_clients?.[0]?.clients?.name?.toLowerCase().includes(q) ||
      c.current_status.includes(q)
    ))
  }

  if (loading) {
    return <View style={s.center}><ActivityIndicator color="#0A1A3C" /></View>
  }

  return (
    <>
      <FlatList
        style={s.root}
        data={filtered}
        keyExtractor={c => c.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
        ListHeaderComponent={
          <View style={s.listHeader}>
            {/* Hamburger */}
            <TouchableOpacity onPress={() => setDrawerOpen(true)} style={s.hamburger} activeOpacity={0.7}>
              <View style={s.hLine} />
              <View style={[s.hLine, { width: 16 }]} />
              <View style={s.hLine} />
            </TouchableOpacity>
            <Text style={s.screenTitle}>Contenedores</Text>
            <Text style={s.countBadge}>{filtered.length}</Text>
          </View>
        }
        ListHeaderComponentStyle={{ marginBottom: 8 }}
        renderItem={({ item: c }) => {
          const color   = STATUS_COLOR[c.current_status] ?? '#556479'
          const label   = STATUS_LABEL[c.current_status] ?? c.current_status
          const client  = c.container_clients?.[0]?.clients?.name ?? '—'
          const isLcl   = c.container_clients.length > 1

          return (
            <TouchableOpacity
              style={[s.card, { borderLeftColor: color }]}
              onPress={() => router.push(`/contenedor/${c.id}`)}
              activeOpacity={0.7}
            >
              <View style={s.cardRow}>
                <Text style={s.num}>{c.container_number}</Text>
                {isLcl && <Text style={s.lcl}>LCL</Text>}
              </View>
              <Text style={s.client}>{client}{isLcl ? ` +${c.container_clients.length - 1}` : ''}</Text>
              <Text style={s.route}>{c.origin_port} → {c.destination_port}</Text>
              <View style={s.cardFooter}>
                <Text style={[s.badge, { color, backgroundColor: color + '18' }]}>
                  {label}
                </Text>
                {c.eta_date && (
                  <Text style={s.eta}>
                    ETA {new Date(c.eta_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <Text style={s.empty}>Sin contenedores</Text>
        }
      />

      {/* Search bar — sticky outside FlatList header for simplicity */}
      <View style={s.searchWrapper} pointerEvents="box-none">
        <TextInput
          style={s.search}
          placeholder="Buscar contenedor o cliente…"
          placeholderTextColor="#b0bac3"
          value={search}
          onChangeText={onSearch}
        />
      </View>

      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} profile={profile} />
    </>
  )
}

const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#f7fafc' },
  center:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8 },
  hamburger:  { gap: 4, padding: 4, backgroundColor: '#0A1A3C', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  hLine:      { width: 18, height: 2, backgroundColor: '#F1F5F9', borderRadius: 1 },
  screenTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#0a1a3c', letterSpacing: -0.3 },
  countBadge:  { fontSize: 10, fontWeight: '700', color: '#8a9aaa', backgroundColor: '#f0f2f5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  searchWrapper: { position: 'absolute', bottom: 72, left: 16, right: 16 },
  search:   { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 13, color: '#181c1e', shadowColor: '#0a1a3c', shadowOpacity: 0.10, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: '#e8ebee' },
  card:     { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderLeftWidth: 4, shadowColor: '#0a1a3c', shadowOpacity: 0.07, shadowRadius: 10, elevation: 2 },
  cardRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  num:      { fontSize: 13, fontWeight: '800', color: '#0a1a3c', fontVariant: ['tabular-nums'] },
  lcl:      { fontSize: 9, fontWeight: '700', color: '#0369a1', backgroundColor: '#e0f2fe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  client:   { fontSize: 11, color: '#6b7a8a', fontWeight: '600', marginBottom: 2 },
  route:    { fontSize: 10, color: '#8a9aaa', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge:    { fontSize: 10, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  eta:      { fontSize: 9, fontWeight: '700', color: '#8a9aaa' },
  empty:    { textAlign: 'center', color: '#b0bac3', marginTop: 40, fontSize: 13 },
})
