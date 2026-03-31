import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useAuth }   from '../../store/auth'
import { Colors, FontSize, FontWeight, Radius, Space, Shadow, Gradients } from '../../utils/theme'

export default function LoginScreen() {
  const router        = useRouter()
  const { login, familyOptions, clearFamilyOptions } = useAuth()
  const [value, setValue]       = useState('')
  const [password, setPassword] = useState('')
  const [familySlug, setFamilySlug] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const canSubmit = value.length >= 4 && password.length >= 6

  const handleLogin = async (slug?: string) => {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      await login(value, password, slug || familySlug || undefined)
    } catch (e: any) {
      if (e?.response?.status === 422 && e?.response?.data?.error === 'family_required') {
        // familyOptions are now set in the store — UI will show picker
        setError('')
      } else {
        setError(
          e?.response?.status === 401
            ? 'Incorrect phone/email or password'
            : 'Something went wrong. Please try again.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#F0FDF9', '#E8FAF3', '#F8FAFC']}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo mark */}
          <View style={styles.logoWrap}>
            <LinearGradient
              colors={Gradients.teal as unknown as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logo}
            >
              <Text style={styles.logoIcon}>🛒</Text>
            </LinearGradient>
            <Text style={styles.appName}>FamilyCart</Text>
            <Text style={styles.tagline}>Shopping together, simply.</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>Sign in to your account</Text>

            <Text style={styles.label}>Phone or email</Text>
            <TextInput
              style={styles.input}
              placeholder="+972 50 000 0000"
              placeholderTextColor={Colors.textTertiary}
              value={value}
              onChangeText={t => { setValue(t); setError(''); clearFamilyOptions() }}
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
              onSubmitEditing={() => handleLogin()}
            />

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            {/* Family picker when user belongs to multiple families */}
            {familyOptions && familyOptions.length > 0 && (
              <View style={styles.familyPicker}>
                <Text style={styles.familyPickerTitle}>Select your family:</Text>
                {familyOptions.map(f => (
                  <TouchableOpacity
                    key={f.slug}
                    style={styles.familyOption}
                    onPress={() => {
                      setFamilySlug(f.slug)
                      handleLogin(f.slug)
                    }}
                  >
                    <Text style={styles.familyOptionName}>{f.name}</Text>
                    <Text style={styles.familyOptionSlug}>{f.slug}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.btn, !canSubmit && styles.btnDisabled]}
              onPress={() => handleLogin()}
              activeOpacity={0.85}
              disabled={!canSubmit || loading}
            >
              <LinearGradient
                colors={Gradients.teal as unknown as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.btnText}>Sign in</Text>
                }
              </LinearGradient>
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
      </LinearGradient>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex:         { flex: 1 },
  container:    { flexGrow: 1, justifyContent: 'center', padding: Space.xl },
  logoWrap:     { alignItems: 'center', marginBottom: Space.xxl + 8 },
  logo:         {
    width: 80, height: 80, borderRadius: Radius.xl,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Space.lg,
    ...Shadow.glow,
  },
  logoIcon:     { fontSize: 36 },
  appName:      { fontSize: FontSize.hero, fontWeight: FontWeight.bold, color: Colors.textPrimary, letterSpacing: -0.8 },
  tagline:      { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Space.xs },
  card:         {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Space.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.elevated,
  },
  cardTitle:    { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  cardSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Space.xs, marginBottom: Space.xl },
  label:        { fontSize: FontSize.xs, fontWeight: FontWeight.semi, color: Colors.textSecondary, marginBottom: Space.xs, letterSpacing: 0.5, textTransform: 'uppercase' },
  familyPicker:      { marginBottom: Space.md },
  familyPickerTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semi, color: Colors.textSecondary, marginBottom: Space.sm },
  familyOption:      { backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, padding: Space.md, marginBottom: Space.xs },
  familyOptionName:  { fontSize: FontSize.md, fontWeight: FontWeight.semi, color: Colors.textPrimary },
  familyOptionSlug:  { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  input:        {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Space.lg, paddingVertical: 14,
    fontSize: FontSize.md, color: Colors.textPrimary,
    marginBottom: Space.md,
  },
  errorText:    { fontSize: FontSize.xs, color: Colors.danger, marginBottom: Space.sm, marginTop: -Space.xs },
  btn:          {
    borderRadius: Radius.sm,
    overflow: 'hidden',
    marginTop: Space.sm,
  },
  btnGradient:  {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  btnDisabled:  { opacity: 0.45 },
  btnText:      { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semi },
  divider:      { flexDirection: 'row', alignItems: 'center', marginVertical: Space.lg },
  dividerLine:  { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText:  { fontSize: FontSize.xs, color: Colors.textTertiary, marginHorizontal: Space.md },
  outlineBtn:   {
    borderWidth: 1.5, borderColor: Colors.borderMid,
    borderRadius: Radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  outlineBtnText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  inviteLink:   { alignItems: 'center', marginTop: Space.xl },
  inviteLinkText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  inviteLinkAccent: { color: Colors.teal, fontWeight: FontWeight.semi },
})