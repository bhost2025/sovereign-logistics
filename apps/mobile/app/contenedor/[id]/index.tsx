import { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import StatusBottomSheet from '../../../components/StatusBottomSheet'

const STATUS_COLOR: Record<string, string> = {
  en_puerto_origen: '#556479', zarpo: '#4A6FA5',
  en_transito_maritimo: '#4A6FA5', eta_puerto_destino: '#4A6FA5',
  en_aduana: '#B8860B', liberado_aduana: '#1A7A8A',
  detenido_aduana: '#C05A00', transito_terrestre: '#7A6A00', entregado: '#1A7A8A',
}
const STATUS_LABEL: Record<string, string> = {
  en_puerto_origen: 'Puerto Origen', zarpo: 'Zarpó',
  en_transito_maritimo: 'En Tránsito', eta_puerto_destino: 'ETA Puerto',
  en_aduana: 'En Aduana', liberado_aduana: 'Liberado ✓',
  detenido_aduana: 'Detenido ▲', transito_terrestre: 'T. Terrestre', entregado: 'Entregado',
}

export default function ContenedorDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [data, setData]           = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const load = useCallback(async () => {
    const { data: res } = await supabase
      .from('containers')
      .select(`
        *, container_clients(share_pct, clients(name, contact_name)),
        container_status_log(id, new_status, notes, changed_at, users(full_name))
      `)
      .eq('id', id)
      .order('changed_at', { referencedTable: 'container_status_log', ascending: true })
      .single()
    setData(res)
    setLoading(false)
    setRefreshing(false)
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return <View style={s.center}><ActivityIndicator color="#0A1A3C" /></View>
  if (!data) return <View style={s.center}><Text>No encontrado</Text></View>

  const color = STATUS_COLOR[data.current_status] ?? '#556479'
  const label = STATUS_LABEL[data.current_status] ?? data.current_status
  const log   = data.container_status_log ?? []

  return (
    <>
      <ScrollView
        style={s.root}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
      >
        {/* Header navy */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.back}>
            <Text style={s.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={s.num}>{data.container_number}</Text>
          {data.bl_number && <Text style={s.bl}>BL: {data.bl_number}</Text>}
          <View style={[s.badge, { backgroundColor: color + '25' }]}>
            <Text style={[s.badgeText, { color }]}>{label}</Text>
          </View>
        </View>

        <View style={s.body}>
          {/* Detained banner */}
          {data.current_status === 'detenido_aduana' && (
            <View style={s.alertBanner}>
              <Text style={s.alertBannerText}>◆ Contenedor detenido en aduana — revisión requerida</Text>
            </View>
          )}

          {/* Datos del viaje */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Datos del viaje</Text>
            {[
              ['Puerto Origen',  data.origin_port],
              ['Puerto Destino', data.destination_port],
              ['ETA', data.eta_date
                ? new Date(data.eta_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
                : '—'],
              ['Tipo', data.lcl ? 'LCL (Carga Consolidada)' : 'FCL'],
            ].map(([k, v]) => (
              <View key={k} style={s.row}>
                <Text style={s.rowLabel}>{k}</Text>
                <Text style={s.rowValue}>{v}</Text>
              </View>
            ))}
          </View>

          {/* Clientes */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Clientes</Text>
            {(data.container_clients ?? []).length === 0 && (
              <Text style={s.empty}>Sin clientes asignados</Text>
            )}
            {(data.container_clients ?? []).map((cc: any, i: number) => (
              <View key={i} style={s.row}>
                <Text style={s.rowValue}>{cc.clients?.name}</Text>
                {cc.share_pct != null && <Text style={s.rowLabel}>{cc.share_pct}%</Text>}
              </View>
            ))}
          </View>

          {/* Timeline */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Historial</Text>
            {log.length === 0 && <Text style={s.empty}>Sin historial de estados</Text>}
            {log.map((entry: any, i: number) => {
              const c         = STATUS_COLOR[entry.new_status] ?? '#556479'
              const isCurrent = i === log.length - 1
              return (
                <View key={entry.id} style={s.timelineItem}>
                  <View style={{ alignItems: 'center', width: 20 }}>
                    <View style={[s.dot, { backgroundColor: isCurrent ? c : '#e8ebee' }]} />
                    {i < log.length - 1 && <View style={s.timelineLine} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.timelineStatus, { color: isCurrent ? c : '#181c1e' }]}>
                      {STATUS_LABEL[entry.new_status] ?? entry.new_status}
                    </Text>
                    {entry.notes && <Text style={s.timelineNotes}>{entry.notes}</Text>}
                    <View style={s.timelineMeta}>
                      <Text style={s.timelineDate}>
                        {new Date(entry.changed_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                      {entry.users?.full_name && (
                        <Text style={s.timelineUser}> · {entry.users.full_name}</Text>
                      )}
                    </View>
                  </View>
                </View>
              )
            })}
          </View>

          {/* CTA — bottom sheet */}
          <TouchableOpacity
            style={s.cta}
            onPress={() => setSheetOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={s.ctaText}>Actualizar Estado</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <StatusBottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        containerId={id}
        currentStatus={data.current_status}
        onSuccess={load}
      />
    </>
  )
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f7fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#0A1A3C', padding: 24, paddingTop: 56, paddingBottom: 28 },
  back:   { marginBottom: 12 },
  backText: { color: '#8a9aaa', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  num:    { color: '#F1F5F9', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  bl:     { color: '#8a9aaa', fontSize: 11, marginTop: 2 },
  badge:  { marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  body:   { padding: 16, gap: 12 },
  alertBanner: { backgroundColor: '#fff3ed', borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: '#C05A00' },
  alertBannerText: { fontSize: 12, fontWeight: '700', color: '#C05A00' },
  card:   { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#0a1a3c', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  cardTitle: { fontSize: 9, fontWeight: '700', color: '#8a9aaa', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 },
  row:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontSize: 10, color: '#8a9aaa', fontWeight: '600' },
  rowValue: { fontSize: 12, color: '#181c1e', fontWeight: '600', flex: 1, textAlign: 'right' },
  empty:    { fontSize: 12, color: '#b0bac3', textAlign: 'center', paddingVertical: 8 },
  timelineItem: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  dot:    { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  timelineLine: { width: 1, flex: 1, backgroundColor: '#e8ebee', marginTop: 4, marginBottom: -4 },
  timelineStatus: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  timelineNotes:  { fontSize: 11, color: '#6b7a8a', marginBottom: 2 },
  timelineMeta:   { flexDirection: 'row' },
  timelineDate:   { fontSize: 10, color: '#b0bac3' },
  timelineUser:   { fontSize: 10, color: '#b0bac3' },
  cta:    { backgroundColor: '#0A1A3C', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 4 },
  ctaText: { color: '#F1F5F9', fontSize: 15, fontWeight: '800' },
})
