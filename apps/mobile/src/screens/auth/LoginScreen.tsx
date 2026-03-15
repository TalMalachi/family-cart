import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth }   from '../../store/auth'
import { Colors, FontSize, FontWeight, Radius, Space, Shadow } from '../../utils/theme'

export default function LoginScreen() {
  const router        = useRouter()
  const { login }     = useAuth()
  const [value, setValue]   = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const canSubmit = value.length >= 4 && password.length >= 6

  const handleLogin = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      await login(value, password)
      // Navigation handled by RootLayout auth guard
    } catch (e: any) {
      setError(
        e?.response?.status === 401
          ? 'Incorrect phone/email or password'
          : 'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo mark */}
        <View style={styles.logoWrap}>
          <View style={styles.logo}>
            <Text style={styles.logoIcon}>🛒</Text>
          </View>
          <Text style={styles.appName}>FamilyCart</Text>
          <Text style={styles.tagline}>Shopping together, simply.</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in</Text>

          <Text style={styles.label}>Phone or email</Text>
          <TextInput
            style={styles.input}
            placeholder="+972 50 000 0000"
            placeholderTextColor={Colors.textTertiary}
            value={value}
            onChangeText={t => { setValue(t); setError('') }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={Colors.textTertiary}
            value={password}
            onChangeText={t => { setPassword(t); setError('') }}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.btn, !canSubmit && styles.btnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={!canSubmit || loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnText}>Sign in</Text>
            }
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineBtnText}>Create family account</Text>
          </TouchableOpacity>
        </View>

        {/* Invite code link */}
        <TouchableOpacity
          style={styles.inviteLink}
          onPress={() => router.push('/(auth)/verify-sms')}
        >
          <Text style={styles.inviteLinkText}>
            Got an invite code?{' '}
            <Text style={styles.inviteLinkAccent}>Enter it here</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex:         { flex: 1, backgroundColor: Colors.bg },
  container:    { flexGrow: 1, justifyContent: 'center', padding: Space.xl },
  logoWrap:     { alignItems: 'center', marginBottom: Space.xxl },
  logo:         {
    width: 72, height: 72, borderRadius: Radius.xl,
    backgroundColor: Colors.teal,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Space.md,
    ...Shadow.strong,
  },
  logoIcon:     { fontSize: 34 },
  appName:      { fontSize: FontSize.xxl, fontWeight: FontWeight.semi, color: Colors.textPrimary, letterSpacing: -0.5 },
  tagline:      { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Space.xs },
  card:         {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Space.xl,
    borderWidth: 0.5,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  cardTitle:    { fontSize: FontSize.lg, fontWeight: FontWeight.medium, color: Colors.textPrimary, marginBottom: Space.lg },
  label:        { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: Space.xs, letterSpacing: 0.4, textTransform: 'uppercase' },
  input:        {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 0.5, borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Space.md, paddingVertical: 11,
    fontSize: FontSize.md, color: Colors.textPrimary,
    marginBottom: Space.md,
  },
  errorText:    { fontSize: FontSize.xs, color: Colors.danger, marginBottom: Space.sm, marginTop: -Space.xs },
  btn:          {
    backgroundColor: Colors.teal,
    borderRadius: Radius.sm,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: Space.xs,
  },
  btnDisabled:  { opacity: 0.45 },
  btnText:      { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  divider:      { flexDirection: 'row', alignItems: 'center', marginVertical: Space.md },
  dividerLine:  { flex: 1, height: 0.5, backgroundColor: Colors.border },
  dividerText:  { fontSize: FontSize.xs, color: Colors.textTertiary, marginHorizontal: Space.sm },
  outlineBtn:   {
    borderWidth: 0.5, borderColor: Colors.borderMid,
    borderRadius: Radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineBtnText: { fontSize: FontSize.md, color: Colors.textSecondary },
  inviteLink:   { alignItems: 'center', marginTop: Space.xl },
  inviteLinkText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  inviteLinkAccent: { color: Colors.teal, fontWeight: FontWeight.medium },
})
