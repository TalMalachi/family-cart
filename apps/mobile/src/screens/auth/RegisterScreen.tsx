import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { api }       from '../../services/api'
import { useAuth }   from '../../store/auth'
import { Colors, FontSize, FontWeight, Radius, Space, Shadow } from '../../utils/theme'

type Step = 1 | 2 | 3
type Role = 'admin' | 'member'

function StepDots({ current }: { current: Step }) {
  return (
    <View style={styles.dots}>
      {([1, 2, 3] as Step[]).map(s => (
        <View
          key={s}
          style={[styles.dot, s <= current && styles.dotActive, s === current && styles.dotCurrent]}
        />
      ))}
    </View>
  )
}

function PasswordStrength({ password }: { password: string }) {
  let strength = 0
  if (password.length >= 8)                  strength++
  if (/[A-Z]/.test(password))                strength++
  if (/[0-9!@#$%^&*]/.test(password))        strength++

  const label  = ['', 'Weak', 'Fair', 'Strong'][strength]
  const color  = ['', Colors.danger, Colors.warning, Colors.teal][strength]
  const width  = `${(strength / 3) * 100}%` as any

  return (
    <View style={{ marginBottom: Space.md }}>
      <View style={styles.strengthBar}>
        <View style={[styles.strengthFill, { width, backgroundColor: color }]} />
      </View>
      {password.length > 0 && (
        <Text style={[styles.strengthLabel, { color }]}>{label} password</Text>
      )}
    </View>
  )
}

export default function RegisterScreen() {
  const router     = useRouter()
  const { setToken } = useAuth()
  const [step, setStep]         = useState<Step>(1)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone]       = useState('')
  const [email, setEmail]       = useState('')
  const [role, setRole]         = useState<Role>('admin')
  const [familyName, setFamilyName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleRegister = async () => {
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/register', {
        fullName, phone, email, password, role,
        familyName: familyName || undefined,
      })
      await setToken(data.token)
      setStep(3)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Back button */}
        {step < 3 && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => step === 1 ? router.back() : setStep((step - 1) as Step)}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.title}>
          {step === 1 ? 'Create your family' : step === 2 ? 'Set a password' : 'You're all set!'}
        </Text>
        <StepDots current={step} />

        {/* ── Step 1: Account details ── */}
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.label}>Full name</Text>
            <TextInput style={styles.input} placeholder="Yael Levi"
              placeholderTextColor={Colors.textTertiary}
              value={fullName} onChangeText={setFullName} autoCapitalize="words" />

            <Text style={styles.label}>Phone number</Text>
            <TextInput style={styles.input} placeholder="+972 50 000 0000"
              placeholderTextColor={Colors.textTertiary}
              value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="yael@example.com"
              placeholderTextColor={Colors.textTertiary}
              value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.label}>Family name (optional)</Text>
            <TextInput style={styles.input} placeholder="The Levi Family"
              placeholderTextColor={Colors.textTertiary}
              value={familyName} onChangeText={setFamilyName} />

            <Text style={[styles.label, { marginTop: Space.xs }]}>Your role</Text>
            <View style={styles.roleRow}>
              {(['admin', 'member'] as Role[]).map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.rolePill, role === r && styles.rolePillActive]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.roleName, role === r && styles.roleNameActive]}>
                    {r === 'admin' ? 'Admin' : 'Member'}
                  </Text>
                  <Text style={[styles.roleSub, role === r && styles.roleSubActive]}>
                    {r === 'admin' ? 'Manage family & invite' : 'Shop & track expenses'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.btn, (!fullName || !phone || !email) && styles.btnDisabled]}
              disabled={!fullName || !phone || !email}
              onPress={() => setStep(2)}
            >
              <Text style={styles.btnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2: Password ── */}
        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} placeholder="Min. 8 characters"
              placeholderTextColor={Colors.textTertiary}
              value={password} onChangeText={setPassword}
              secureTextEntry autoFocus />
            <PasswordStrength password={password} />

            <Text style={styles.label}>Confirm password</Text>
            <TextInput style={styles.input} placeholder="Repeat password"
              placeholderTextColor={Colors.textTertiary}
              value={confirm} onChangeText={t => { setConfirm(t); setError('') }}
              secureTextEntry />

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.btn, (password.length < 8 || !confirm) && styles.btnDisabled]}
              disabled={password.length < 8 || !confirm || loading}
              onPress={handleRegister}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.btnText}>Create account</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 3: Success ── */}
        {step === 3 && (
          <View style={[styles.card, { alignItems: 'center' }]}>
            <View style={styles.successCircle}>
              <Text style={{ fontSize: 28 }}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Account created!</Text>
            <Text style={styles.successBody}>
              Your family has been set up. Invite members to start shopping together.
            </Text>
            <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)/members')}>
              <Text style={styles.btnText}>Invite a member</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.outlineBtn, { marginTop: Space.sm }]}
              onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.outlineBtnText}>Go to app</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:      { flexGrow: 1, padding: Space.xl, paddingTop: 56 },
  backBtn:        { marginBottom: Space.lg },
  backText:       { fontSize: FontSize.sm, color: Colors.teal, fontWeight: FontWeight.medium },
  title:          { fontSize: FontSize.xl, fontWeight: FontWeight.semi, color: Colors.textPrimary, letterSpacing: -0.3 },
  dots:           { flexDirection: 'row', gap: 6, marginTop: Space.sm, marginBottom: Space.lg },
  dot:            { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive:      { backgroundColor: Colors.tealLight, width: 6 },
  dotCurrent:     { backgroundColor: Colors.teal, width: 20, borderRadius: 3 },
  card:           { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Space.xl, borderWidth: 0.5, borderColor: Colors.border, ...Shadow.card },
  label:          { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: Space.xs, letterSpacing: 0.4, textTransform: 'uppercase' },
  input:          { backgroundColor: Colors.bgSecondary, borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Space.md, paddingVertical: 11, fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Space.md },
  roleRow:        { flexDirection: 'row', gap: Space.sm, marginBottom: Space.lg },
  rolePill:       { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Space.md },
  rolePillActive: { borderColor: Colors.teal, backgroundColor: Colors.tealLight },
  roleName:       { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  roleNameActive: { color: Colors.tealDark },
  roleSub:        { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  roleSubActive:  { color: Colors.tealMid },
  btn:            { backgroundColor: Colors.teal, borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center', marginTop: Space.xs, width: '100%' },
  btnDisabled:    { opacity: 0.45 },
  btnText:        { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  outlineBtn:     { borderWidth: 0.5, borderColor: Colors.borderMid, borderRadius: Radius.sm, paddingVertical: 12, alignItems: 'center', width: '100%' },
  outlineBtnText: { fontSize: FontSize.md, color: Colors.textSecondary },
  strengthBar:    { height: 3, backgroundColor: Colors.bgSecondary, borderRadius: 2, marginBottom: Space.xs, overflow: 'hidden' },
  strengthFill:   { height: '100%', borderRadius: 2 },
  strengthLabel:  { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  errorText:      { fontSize: FontSize.xs, color: Colors.danger, marginBottom: Space.sm },
  successCircle:  { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.tealLight, alignItems: 'center', justifyContent: 'center', marginBottom: Space.lg },
  successTitle:   { fontSize: FontSize.lg, fontWeight: FontWeight.medium, color: Colors.textPrimary, marginBottom: Space.sm },
  successBody:    { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Space.xl },
})
