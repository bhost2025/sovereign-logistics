import { useEffect, useRef } from 'react'
import {
  Modal, View, Text, TouchableOpacity, Animated,
  StyleSheet, Platform, TouchableWithoutFeedback,
} from 'react-native'
import { router } from 'expo-router'

const NAV_ITEMS = [
  { href: '/(tabs)/tablero',      label: 'Tablero',       symbol: '◈' },
  { href: '/(tabs)/',             label: 'Contenedores',  symbol: '◱' },
  { href: '/(tabs)/alertas',      label: 'Alertas',       symbol: '◆' },
  { href: '/(tabs)/perfil',       label: 'Mi Perfil',     symbol: '◎' },
]

type Props = {
  visible: boolean
  onClose: () => void
  profile?: { full_name?: string; role?: string; email?: string } | null
}

export default function DrawerMenu({ visible, onClose, profile }: Props) {
  const slideX = useRef(new Animated.Value(-300)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideX, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.spring(slideX, { toValue: -300, useNativeDriver: true, damping: 20, stiffness: 200 }),
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start()
    }
  }, [visible])

  function navigate(href: string) {
    onClose()
    setTimeout(() => router.push(href as any), 150)
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

      {/* Drawer panel */}
      <Animated.View style={[s.drawer, { transform: [{ translateX: slideX }] }]}>
        {/* Brand header */}
        <View style={s.brand}>
          <View style={s.logoBox}>
            <Text style={s.logoLetter}>S</Text>
          </View>
          <View>
            <Text style={s.brandName}>Sovereign</Text>
            <Text style={s.brandSub}>LOGISTICS</Text>
          </View>
        </View>

        {/* Nav links */}
        <View style={s.nav}>
          {NAV_ITEMS.map(item => (
            <TouchableOpacity
              key={item.href}
              style={s.navItem}
              onPress={() => navigate(item.href)}
              activeOpacity={0.7}
            >
              <Text style={s.navSymbol}>{item.symbol}</Text>
              <Text style={s.navLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Profile footer */}
        {profile && (
          <View style={s.profileSection}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>
                {profile.full_name?.slice(0, 2).toUpperCase() ?? '??'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.profileName} numberOfLines={1}>{profile.full_name ?? '—'}</Text>
              <Text style={s.profileRole}>{profile.role?.replace('_', ' ').toUpperCase() ?? '—'}</Text>
            </View>
          </View>
        )}
      </Animated.View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,26,60,0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    shadowColor: '#0a1a3c',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  logoBox: {
    width: 36,
    height: 36,
    backgroundColor: '#0A1A3C',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoLetter: { color: '#F1F5F9', fontSize: 18, fontWeight: '800' },
  brandName: { fontSize: 14, fontWeight: '800', color: '#0A1A3C' },
  brandSub:  { fontSize: 8,  fontWeight: '700', color: '#8a9aaa', letterSpacing: 2 },
  nav: {
    paddingTop: 16,
    paddingHorizontal: 12,
    gap: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 10,
  },
  navSymbol: { fontSize: 14, color: '#4A6FA5', width: 20, textAlign: 'center' },
  navLabel:  { fontSize: 14, fontWeight: '700', color: '#181c1e' },
  profileSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f5',
    backgroundColor: '#fafbfc',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0A1A3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText:   { color: '#F1F5F9', fontSize: 14, fontWeight: '800' },
  profileName:  { fontSize: 13, fontWeight: '700', color: '#0a1a3c' },
  profileRole:  { fontSize: 9,  fontWeight: '700', color: '#8a9aaa', letterSpacing: 1 },
})
