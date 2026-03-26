import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { api }     from '../../services/api'
import { useAuth } from '../../store/auth'
import { Colors, FontSize, FontWeight, Radius, Space, Shadow, Gradients } from '../../utils/theme'

function StrengthBar({ password }: { password: string }) {
  let s = 0
  if (password.length >= 8)           s++
  if (/[A-Z]/.test(password))         s++
  if (/[0-9!@#$%^&*]/.test(password)) s++
  const colors = ['', Colors.danger, Colors.amber, Colors.teal]
  const labels = ['', 'Weak', 'Fair', 'Strong']
  return (
    <View style={{ marginBottom: Space.md }}>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${(s / 3) * 100}%` as any, backgroundColor: colors[s] }]} />
      </View>
      {password.length > 0 && <Text style={[styles.barLabel, { color: colors[s] }]}>{labels[s]} password</Text>}
    </View>
  )
}

export default function SetPasswordScreen() {
  const router    = useRouter()
  const { setToken } = useAuth()
  const { tempToken, fullName } = useLocalSearchParams<{ tempToken: string; fullName: string }>()

  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [done,     setDone]     = useState(false)

  const handleSubmit = async () => {
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/set-password', {
        token: tempToken, password, confirmPassword: confirm,
      })
      await setToken(data.token)
      setDone(true)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <LinearGradient colors={['#F0FDF9', '#E8FAF3', '#F8FAFC']} style={styles.centred}>
        <LinearGradient
          colors={Gradients.teal as unknown as [string, string, ...string[]]}
          style={styles.successCircle}
        >
          <Text style={{ fontSize: 32, color: Colors.white }}>✓</Text>
        </LinearGradient>
        <Text style={styles.successTitle}>Welcome, {fullName}!</Text>
        <Text style={styles.successBody}>
          You've joined the family. Your account is ready.
        </Text>
        <View style={styles.permBox}>
          <Text style={styles.permTitle}>Your starting permissions</Text>
          {['View & edit shopping lists', 'Mark items as purchased', 'Add & view expenses', 'Upload product photos'].map(p => (
            <Text key={p} style={styles.permItem}>✓  {p}</Text>
          ))}
        </View>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)')}>
          <LinearGradient
            colors={Gradients.teal as unknown as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnGradient}
          >
            <Text style={styles.btnText}>Open FamilyCart</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#F0FDF9', '#E8FAF3', '#F8FAFC']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Set your password</Text>
          <Text style={styles.subtitle}>
            Choose a strong password to secure your account, {fullName}.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>New password</Text>
            <TextInput
              style={styles.input}
              placeholder="Min. 8 characters"
              placeholderTextColor={Colors.textTertiary}
              value={password}
              onChangeText={t => { setPassword(t); setError('') }}
              secureTextEntry
              autoFocus
            />
            <StrengthBar password={password} />

            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              style={styles.input}
              placeholder="Repeat password"
              placeholderTextColor={Colors.textTertiary}
              value={confirm}
              onChangeText={t => { setConfirm(t); setError('') }}
              secureTextEntry
            />

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.btn, (password.length < 8 || !confirm) && styles.btnDisabled]}
              disabled={password.length < 8 || !confirm || loading}
              onPress={handleSubmit}
            >
              <LinearGradient
                colors={Gradients.teal as unknown as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.btnText}>Set password & enter app</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:     { flexGrow: 1, padding: Space.xl, paddingTop: 56 },
  centred:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space.xl },
  title:         { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Space.xs, letterSpacing: -0.5 },
  subtitle:      { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22, marginBottom: Space.xl },
  card:          { backgroundColor: Colors.bgCard, borderRadius: Radius.xl, padding: Space.xl, borderWidth: 1, borderColor: Colors.border, ...Shadow.elevated },
  label:         { fontSize: FontSize.xs, fontWeight: FontWeight.semi, color: Colors.textSecondary, marginBottom: Space.xs, letterSpacing: 0.5, textTransform: 'uppercase' },
  input:         { backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Space.lg, paddingVertical: 14, fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Space.md },
  bar:           { height: 4, backgroundColor: Colors.bgSecondary, borderRadius: 2, marginBottom: Space.xs, overflow: 'hidden' },
  barFill:       { height: '100%', borderRadius: 2 },
  barLabel:      { fontSize: FontSize.xs, fontWeight: FontWeight.semi },
  errorText:     { fontSize: FontSize.xs, color: Colors.danger, marginBottom: Space.sm },
  btn:           { borderRadius: Radius.sm, overflow: 'hidden', marginTop: Space.sm, width: '100%' },
  btnGradient:   { paddingVertical: 15, alignItems: 'center', borderRadius: Radius.sm },
  btnDisabled:   { opacity: 0.45 },
  btnText:       { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semi },
  successCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Space.xl, ...Shadow.glow },
  successTitle:  { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Space.sm },
  successBody:   { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Space.xl },
  permBox:       { backgroundColor: Colors.tealLight, borderRadius: Radius.md, padding: Space.xl, width: '100%', marginBottom: Space.xl },
  permTitle:     { fontSize: FontSize.sm, fontWeight: FontWeight.semi, color: Colors.tealDark, marginBottom: Space.sm },
  permItem:      { fontSize: FontSize.sm, color: Colors.tealMid, lineHeight: 26 },
})