import { useEffect, useRef, useState } from 'react'
import {
  Modal, View, Text, TouchableOpacity, Animated, ScrollView,
  TextInput, StyleSheet, Platform, TouchableWithoutFeedback,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native'
import { supabase } from '../lib/supabase'

const SCREEN_HEIGHT = Dimensions.get('window').height
const SHEET_HEIGHT  = SCREEN_HEIGHT * 0.82

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

type Props = {
  visible: boolean
  onClose: () => void
  containerId: string
  currentStatus: string
  onSuccess?: () => void
}

export default function StatusBottomSheet({ visible, onClose, containerId, currentStatus, onSuccess }: Props) {
  const slideY  = useRef(new Animated.Value(SHEET_HEIGHT)).current
  const opacity = useRef(new Animated.Value(0)).current
  const [selected, setSelected] = useState(currentStatus)
  const [notes, setNotes]       = useState('')
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    if (visible) {
      setSelected(currentStatus)
      setNotes('')
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 200 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.spring(slideY, { toValue: SHEET_HEIGHT, useNativeDriver: true, damping: 22, stiffness: 200 }),
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start()
    }
  }, [visible, currentStatus])

  async function handleSave() {
    if (!selected || selected === currentStatus) {
      Alert.alert('Sin cambios', 'Selecciona un estado diferente al actual.')
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from('containers')
      .update({ current_status: selected, updated_at: new Date().toISOString() } as any)
      .eq('id', containerId)

    await supabase.from('container_status_log').insert({
      container_id:     containerId,
      previous_status:  currentStatus,
      new_status:       selected,
      changed_by:       user?.id ?? null,
      notes:            notes || null,
    } as any)

    setSaving(false)
    onSuccess?.()
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[s.backdrop, { opacity }]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideY }] }]}>
        {/* Handle bar */}
        <View style={s.handleBar} />

        {/* Header */}
        <View style={s.sheetHeader}>
          <Text style={s.sheetTitle}>Actualizar Estado</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.sheetSub}>Selecciona el nuevo estado del contenedor</Text>

        {/* Status list */}
        <ScrollView style={s.scroll} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
          {STATUSES.map(st => {
            const isSelected = selected === st.key
            const isCurrent  = currentStatus === st.key
            return (
              <TouchableOpacity
                key={st.key}
                style={[
                  s.option,
                  isSelected && { borderColor: st.color, backgroundColor: st.color + '12' },
                ]}
                onPress={() => setSelected(st.key)}
                activeOpacity={0.7}
              >
                <View style={[s.optionDot, { backgroundColor: isSelected ? st.color : '#e8ebee' }]}>
                  <Text style={{ color: isSelected ? '#fff' : '#8a9aaa', fontSize: 12, fontWeight: '700' }}>
                    {st.symbol}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.optionLabel, isSelected && { color: st.color, fontWeight: '800' }]}>
                    {st.label}
                  </Text>
                  {isCurrent && (
                    <Text style={[s.currentTag, { color: st.color }]}>Estado actual</Text>
                  )}
                </View>
                <View style={[s.radio, isSelected && { borderColor: st.color }]}>
                  {isSelected && <View style={[s.radioDot, { backgroundColor: st.color }]} />}
                </View>
              </TouchableOpacity>
            )
          })}

          {/* Notes */}
          <TextInput
            style={s.notes}
            placeholder="Notas del cambio (opcional)…"
            placeholderTextColor="#b0bac3"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />

          {/* CTA */}
          <TouchableOpacity
            style={[s.cta, (saving || selected === currentStatus) && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={saving || selected === currentStatus}
            activeOpacity={0.8}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.ctaText}>Confirmar Cambio</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,26,60,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    shadowColor: '#0a1a3c',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#e8ebee',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#0a1a3c' },
  closeBtn:   { padding: 4 },
  closeBtnText: { fontSize: 16, color: '#8a9aaa', fontWeight: '700' },
  sheetSub: {
    fontSize: 11,
    color: '#8a9aaa',
    paddingHorizontal: 20,
    marginTop: 2,
    marginBottom: 16,
  },
  scroll: { flex: 1, paddingHorizontal: 16 },
  option: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#0a1a3c',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  optionDot: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: { fontSize: 14, fontWeight: '600', color: '#181c1e' },
  currentTag: { fontSize: 9, fontWeight: '700', marginTop: 2, letterSpacing: 0.5 },
  radio:  {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#c5c6cf',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  notes: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 14,
    fontSize: 13,
    color: '#181c1e',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#e8ebee',
    marginTop: 4,
  },
  cta: {
    backgroundColor: '#0A1A3C',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaText: { color: '#F1F5F9', fontSize: 15, fontWeight: '800' },
})
