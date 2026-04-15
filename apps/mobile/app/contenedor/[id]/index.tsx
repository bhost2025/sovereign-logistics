import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { supabase } from '../../../lib/supabase'

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
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('containers').select(`
      *, container_clients(share_pct, clients(name, contact_name)),
      container_status_log(id, new_status, notes, changed_at, users(full_name))
    `)
      .eq('id', id)
      .order('changed_at', { referencedTable: 'container_status_log', ascending: true })
      .single()
      .then(({ data }) => { setData(data); setLoading(false) })
  }, [id])

  if (loading) return <View style={s.center}><ActivityIndicator color="#0A1A3C" /></View>
  if (!data) return <View style={s.center}><Text>No encontrado</Text></View>

  const color = STATUS_COLOR[data.current_status] ?? '#556479'
  const label = STATUS_LABEL[data.current_status] ?? data.current_status
  const log = data.container_status_log ?? []

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 40 }}>
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
        {/* Datos del viaje */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Datos del viaje</Text>
          {[
            ['Puerto Origen', data.origin_port],
            ['Puerto Destino', data.destination_port],
            ['ETA', data.eta_date ? new Date(data.eta_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'],
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
          {(data.container_clients ?? []).map((cc: any, i: number) => (
            <View key={i} style={s.row}>
              <Text style={s.rowValue}>{cc.clients?.name}</Text>
              {cc.share_pct && <Text style={s.rowLabel}>{cc.share_pct}%</Text>}
            </View>
          ))}
        </View>

        {/* Timeline */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Historial</Text>
          {log.map((entry: any, i: number) => {
            const c = STATUS_COLOR[entry.new_status] ?? '#556479'
            const isCurrent = i === log.length - 1
            return (
              <View key={entry.id} style={s.timelineItem}>
                <View style={[s.dot, { backgroundColor: isCurrent ? c : '#e8ebee' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.timelineStatus, { color: isCurrent ? c : '#181c1e' }]}>
                    {STATUS_LABEL[entry.new_status] ?? entry.new_status}
                  </Text>
                  {entry.notes && <Text style={s.timelineNotes}>{entry.notes}</Text>}
                  <Text style={s.timelineDate}>
                    {new Date(entry.changed_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>

        {/* CTA cambiar estado */}
        <TouchableOpacity
          style={s.cta}
          onPress={() => router.push(`/contenedor/${id}/estado`)}
          activeOpacity={0.8}
        >
          <Text style={s.ctaText}>Actualizar Estado</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  card:   { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#0a1a3c', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  cardTitle: { fontSize: 9, fontWeight: '700', color: '#8a9aaa', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 },
  row:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontSize: 10, color: '#8a9aaa', fontWeight: '600' },
  rowValue: { fontSize: 12, color: '#181c1e', fontWeight: '600' },
  timelineItem: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  dot:    { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  timelineStatus: { fontSize: 12, fontWeight: '700' },
  timelineNotes:  { fontSize: 11, color: '#6b7a8a', marginTop: 2 },
  timelineDate:   { fontSize: 10, color: '#b0bac3', marginTop: 2 },
  cta:    { backgroundColor: '#0A1A3C', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 4 },
  ctaText: { color: '#F1F5F9', fontSize: 15, fontWeight: '800' },
})
