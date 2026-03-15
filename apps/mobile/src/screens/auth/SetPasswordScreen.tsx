import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { api }     from '../../services/api'
import { useAuth } from '../../store/auth'
import { Colors, FontSize, FontWeight, Radius, Space, Shadow } from '../../utils/theme'

function StrengthBar({ password }: { password: string }) {
  let s = 0
  if (password.length >= 8)           s++
  if (/[A-Z]/.test(password))         s++
  if (/[0-9!@#$%^&*]/.test(password)) s++
  const colors = ['', Colors.danger, Colors.warning, Colors.teal]
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
      <View style={styles.centred}>
        <View style={styles.successCircle}>
          <Text style={{ fontSize: 32 }}>✓</Text>
        </View>
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
          <Text style={styles.btnText}>Open FamilyCart</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnText}>Set password & enter app</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:     { flexGrow: 1, padding: Space.xl, paddingTop: 56, backgroundColor: Colors.bg },
  centred:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space.xl, backgroundColor: Colors.bg },
  title:         { fontSize: FontSize.xl, fontWeight: FontWeight.semi, color: Colors.textPrimary, marginBottom: Space.xs, letterSpacing: -0.3 },
  subtitle:      { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Space.xl },
  card:          { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Space.xl, borderWidth: 0.5, borderColor: Colors.border, ...Shadow.card },
  label:         { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: Space.xs, letterSpacing: 0.4, textTransform: 'uppercase' },
  input:         { backgroundColor: Colors.bgSecondary, borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Space.md, paddingVertical: 11, fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Space.md },
  bar:           { height: 3, backgroundColor: Colors.bgSecondary, borderRadius: 2, marginBottom: Space.xs, overflow: 'hidden' },
  barFill:       { height: '100%', borderRadius: 2 },
  barLabel:      { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  errorText:     { fontSize: FontSize.xs, color: Colors.danger, marginBottom: Space.sm },
  btn:           { backgroundColor: Colors.teal, borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center', marginTop: Space.xs, width: '100%' },
  btnDisabled:   { opacity: 0.45 },
  btnText:       { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  successCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.tealLight, alignItems: 'center', justifyContent: 'center', marginBottom: Space.lg },
  successTitle:  { fontSize: FontSize.xl, fontWeight: FontWeight.semi, color: Colors.textPrimary, marginBottom: Space.sm, letterSpacing: -0.3 },
  successBody:   { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Space.xl },
  permBox:       { backgroundColor: Colors.tealLight, borderRadius: Radius.md, padding: Space.lg, width: '100%', marginBottom: Space.xl },
  permTitle:     { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.tealDark, marginBottom: Space.sm },
  permItem:      { fontSize: FontSize.sm, color: Colors.tealMid, lineHeight: 24 },
})
