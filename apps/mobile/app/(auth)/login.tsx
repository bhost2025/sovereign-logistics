import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native'
import { supabase } from '../../lib/supabase'

export default function LoginScreen() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Ingresa tu correo y contraseña.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) Alert.alert('Error', 'Credenciales incorrectas. Intenta de nuevo.')
    // Si el login es exitoso, el listener en _layout.tsx redirige automáticamente
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.inner}>
        {/* Logo */}
        <View style={s.logoRow}>
          <View style={s.logoBox}>
            <Text style={s.logoLetter}>S</Text>
          </View>
          <View>
            <Text style={s.logoName}>Sovereign Logistics</Text>
            <Text style={s.logoSub}>CHINA · MÉXICO OPS</Text>
          </View>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.title}>Iniciar sesión</Text>
          <Text style={s.subtitle}>Ingresa con tus credenciales de operación</Text>

          <View style={s.field}>
            <Text style={s.label}>CORREO ELECTRÓNICO</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="operador@empresa.com"
              placeholderTextColor="#b0bac3"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>CONTRASEÑA</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#b0bac3"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Entrar</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#f7fafc' },
  inner:     { flex: 1, justifyContent: 'center', padding: 28 },
  logoRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32, justifyContent: 'center' },
  logoBox:   { width: 40, height: 40, backgroundColor: '#0A1A3C', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logoLetter:{ color: '#F1F5F9', fontSize: 20, fontWeight: '800' },
  logoName:  { fontSize: 15, fontWeight: '800', color: '#0A1A3C', letterSpacing: -0.3 },
  logoSub:   { fontSize: 9, fontWeight: '700', color: '#8a9aaa', letterSpacing: 1.5 },
  card:      { backgroundColor: '#fff', borderRadius: 20, padding: 28, shadowColor: '#0a1a3c', shadowOpacity: 0.08, shadowRadius: 24, elevation: 4 },
  title:     { fontSize: 20, fontWeight: '800', color: '#0A1A3C', marginBottom: 4 },
  subtitle:  { fontSize: 12, color: '#8a9aaa', marginBottom: 24 },
  field:     { marginBottom: 20 },
  label:     { fontSize: 9, fontWeight: '700', color: '#8a9aaa', letterSpacing: 1.5, marginBottom: 6 },
  input:     { borderBottomWidth: 2, borderBottomColor: '#c5c6cf', paddingVertical: 8, fontSize: 14, fontWeight: '600', color: '#181c1e' },
  btn:       { backgroundColor: '#0A1A3C', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnText:   { color: '#F1F5F9', fontSize: 15, fontWeight: '800' },
})
