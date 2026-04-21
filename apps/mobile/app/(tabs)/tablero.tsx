import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import DrawerMenu from '../../components/DrawerMenu'

type KPI = {
  total: number
  inTransit: number
  inCustoms: number
  detained: number
  delivered: number
}

const DETAINED_STATUSES = ['detenido_aduana']
const TRANSIT_STATUSES  = ['zarpo', 'en_transito_maritimo', 'eta_puerto_destino', 'en_puerto_origen']
const CUSTOMS_STATUSES  = ['en_aduana', 'liberado_aduana', 'transito_terrestre']

export default function TableroScreen() {
  const [kpi, setKpi]           = useState<KPI | null>(null)
  const [profile, setProfile]   = useState<any>(null)
  const [detained, setDetained] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: p } = await supabase.from('users').select('*').eq('id', user.id).single()
      setProfile(p)
    }

    const { data: containers } = await supabase
      .from('containers')
      .select('id, current_status, container_number, container_clients(clients(name))')

    if (containers) {
      const all       = containers.length
      const inTransit = containers.filter(c => TRANSIT_STATUSES.includes(c.current_status)).length
      const inCustoms = containers.filter(c => CUSTOMS_STATUSES.includes(c.current_status)).length
      const det       = containers.filter(c => DETAINED_STATUSES.includes(c.current_status))
      const delivered = containers.filter(c => c.current_status === 'entregado').length

      setKpi({ total: all, inTransit, inCustoms, detained: det.length, delivered })
      setDetained(det)
    }

    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <View style={s.center}><ActivityIndicator color="#0A1A3C" /></View>

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <>
      <ScrollView
        style={s.root}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => setDrawerOpen(true)} style={s.hamburger} activeOpacity={0.7}>
            <View style={s.hLine} />
            <View style={[s.hLine, { width: 16 }]} />
            <View style={s.hLine} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={s.greet}>{greeting}</Text>
            <Text style={s.name} numberOfLines={1}>{profile?.full_name?.split(' ')[0] ?? '—'}</Text>
          </View>
          <View style={s.avatarSmall}>
            <Text style={s.avatarSmallText}>
              {profile?.full_name?.slice(0, 2).toUpperCase() ?? '??'}
            </Text>
          </View>
        </View>

        <View style={s.body}>
          {/* KPI grid */}
          <View style={s.kpiGrid}>
            <KpiCard label="Contenedores" value={kpi?.total ?? 0} color="#0A1A3C" bg="#f0f4ff" />
            <KpiCard label="En Tránsito"  value={kpi?.inTransit ?? 0} color="#4A6FA5" bg="#eef2f8" />
            <KpiCard label="En Aduana"    value={kpi?.inCustoms ?? 0} color="#B8860B" bg="#fdf8ec" />
            <KpiCard label="Entregados"   value={kpi?.delivered ?? 0} color="#1A7A8A" bg="#edf6f7" />
          </View>

          {/* Detained alert */}
          {detained.length > 0 && (
            <View style={s.alertCard}>
              <Text style={s.alertTitle}>◆ {detained.length} Contenedor{detained.length > 1 ? 'es' : ''} Detenido{detained.length > 1 ? 's' : ''}</Text>
              {detained.map((c: any) => (
                <TouchableOpacity
                  key={c.id}
                  style={s.alertRow}
                  onPress={() => router.push(`/contenedor/${c.id}`)}
                  activeOpacity={0.7}
                >
                  <Text style={s.alertNum}>{c.container_number}</Text>
                  <Text style={s.alertChevron}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Quick links */}
          <View style={s.quickLinks}>
            <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/(tabs)/')} activeOpacity={0.8}>
              <Text style={s.quickSymbol}>◱</Text>
              <Text style={s.quickLabel}>Ver Contenedores</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/(tabs)/alertas')} activeOpacity={0.8}>
              <Text style={s.quickSymbol}>◆</Text>
              <Text style={s.quickLabel}>Ver Alertas</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} profile={profile} />
    </>
  )
}

function KpiCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <View style={[s.kpiCard, { backgroundColor: bg }]}>
      <Text style={[s.kpiValue, { color }]}>{value}</Text>
      <Text style={[s.kpiLabel, { color: color + 'aa' }]}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#f7fafc' },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:     { backgroundColor: '#0A1A3C', flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 56, paddingBottom: 24 },
  hamburger:  { gap: 4, padding: 4 },
  hLine:      { width: 20, height: 2, backgroundColor: '#F1F5F9', borderRadius: 1 },
  greet:      { color: '#8a9aaa', fontSize: 11, fontWeight: '600' },
  name:       { color: '#F1F5F9', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  avatarSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1a2e5c', justifyContent: 'center', alignItems: 'center' },
  avatarSmallText: { color: '#F1F5F9', fontSize: 12, fontWeight: '800' },
  body:       { padding: 16, gap: 14 },
  kpiGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard:    { flex: 1, minWidth: '45%', borderRadius: 14, padding: 16 },
  kpiValue:   { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  kpiLabel:   { fontSize: 10, fontWeight: '700', marginTop: 4, letterSpacing: 0.3 },
  alertCard:  { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: '#C05A00', shadowColor: '#0a1a3c', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  alertTitle: { fontSize: 12, fontWeight: '800', color: '#C05A00', marginBottom: 10 },
  alertRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f7f0ed' },
  alertNum:   { fontSize: 13, fontWeight: '700', color: '#0a1a3c' },
  alertChevron: { fontSize: 14, color: '#C05A00', fontWeight: '700' },
  quickLinks: { flexDirection: 'row', gap: 10 },
  quickBtn:   { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', gap: 6, shadowColor: '#0a1a3c', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  quickSymbol:{ fontSize: 18, color: '#4A6FA5' },
  quickLabel: { fontSize: 11, fontWeight: '700', color: '#0a1a3c' },
})
