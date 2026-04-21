import { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { supabase } from '../../../lib/supabase'

const STATUSES = [
  { key: 'en_puerto_origen',     label: 'Puerto Origen',  symbol: '◎', color: '#556479' },
  { key: 'zarpo',                label: 'Zarpó',          symbol: '▶', color: '#4A6FA5' },
  { key: 'en_transito_maritimo', label: 'En Tránsito',    symbol: '◈', color: '#4A6FA5' },
  { key: 'eta_puerto_destino',   label: 'ETA Puerto',     symbol: '◉', color: '#4A6FA5' },
  { key: 'en_aduana',            label: 'En Aduana',      symbol: '◆', color: '#B8860B' },
  { key: 'liberado_aduana',      label: 'Liberado ✓',     symbol: '✓', color: '#1A7A8A' },
  { key: 'detenido_aduana',      label: 'Detenido ▲',     symbol: '▲', color: '#C05A00' },
  { key: 'transito_terrestre',   label: 'T. Terrestre',   symbol: '◱', color: '#7A6A00' },
  { key: 'entregado',            label: 'Entregado',      symbol: '✓', color: '#1A7A8A' },
]

export default function CambiarEstadoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [selected, setSelected] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!selected) { Alert.alert('Selecciona un estado'); return }
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: current } = await supabase.from('containers').select('current_status').eq('id', id).single()

    await supabase.from('containers').update({ current_status: selected, updated_at: new Date().toISOString() } as any).eq('id', id)
    await supabase.from('container_status_log').insert({
      container_id: id,
      previous_status: current?.current_status ?? null,
      new_status: selected,
      changed_by: user?.id ?? null,
      notes: notes || null,
    } as any)

    setSaving(false)
    router.back()
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 48 }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>← Cancelar</Text>
        </TouchableOpacity>
        <Text style={s.title}>Actualizar Estado</Text>
        <Text style={s.sub}>Selecciona el nuevo estado del contenedor</Text>
      </View>

      <View style={s.body}>
        {STATUSES.map(st => {
          const isSelected = selected === st.key
          return (
            <TouchableOpacity
              key={st.key}
              style={[s.option, isSelected && { borderColor: st.color, backgroundColor: st.color + '12' }]}
              onPress={() => setSelected(st.key)}
              activeOpacity={0.7}
            >
              <View style={[s.optionDot, { backgroundColor: isSelected ? st.color : '#e8ebee' }]}>
                <Text style={{ color: isSelected ? '#fff' : '#8a9aaa', fontSize: 12, fontWeight: '700' }}>
                  {st.symbol}
                </Text>
              </View>
              <Text style={[s.optionLabel, isSelected && { color: st.color, fontWeight: '800' }]}>
                {st.label}
              </Text>
              {isSelected && (
                <View style={[s.radio, { borderColor: st.color }]}>
                  <View style={[s.radioDot, { backgroundColor: st.color }]} />
                </View>
              )}
              {!isSelected && <View style={s.radio} />}
            </TouchableOpacity>
          )
        })}

        <TextInput
          style={s.notes}
          placeholder="Notas del cambio (opcional)…"
          placeholderTextColor="#b0bac3"
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
        />

        <TouchableOpacity
          style={[s.cta, (!selected || saving) && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={!selected || saving}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.ctaText}>Confirmar Cambio</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f7fafc' },
  header: { backgroundColor: '#0A1A3C', padding: 24, paddingTop: 56, paddingBottom: 28 },
  back:   { marginBottom: 12 },
  backText: { color: '#8a9aaa', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title:  { color: '#F1F5F9', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  sub:    { color: '#8a9aaa', fontSize: 12, marginTop: 4 },
  body:   { padding: 16, gap: 10 },
  option: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderColor: 'transparent', shadowColor: '#0a1a3c', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  optionDot: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  optionLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#181c1e' },
  radio:  { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#c5c6cf', justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  notes:  { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 13, color: '#181c1e', minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#e8ebee', marginTop: 4 },
  cta:    { backgroundColor: '#0A1A3C', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 8 },
  ctaText: { color: '#F1F5F9', fontSize: 15, fontWeight: '800' },
})
