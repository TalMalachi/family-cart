import React, { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { api }       from '../../services/api'
import { Colors, FontSize, FontWeight, Radius, Space, Shadow } from '../../utils/theme'

const CODE_LENGTH = 6

export default function VerifySmsScreen() {
  const router         = useRouter()
  const [phone, setPhone]   = useState('')
  const [digits, setDigits] = useState<string[]>([])
  const [step, setStep]     = useState<'phone' | 'code'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const enterDigit = (d: string) => {
    if (digits.length >= CODE_LENGTH) return
    setDigits(prev => [...prev, d])
    setError('')
  }

  const deleteDigit = () => setDigits(prev => prev.slice(0, -1))

  const handleVerify = async () => {
    if (digits.length < CODE_LENGTH) return
    setLoading(true); setError('')
    try {
      const code = digits.join('')
      const { data } = await api.post('/auth/verify-sms', { phone, code })
      router.push({ pathname: '/(auth)/set-password', params: { tempToken: data.tempToken, fullName: data.fullName } })
    } catch {
      setError('Invalid or expired code. Please try again.')
      setDigits([])
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('A new code has been sent.')
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        {step === 'phone' ? 'Enter your phone' : 'Enter your code'}
      </Text>
      <Text style={styles.subtitle}>
        {step === 'phone'
          ? 'Type the phone number your admin used to invite you.'
          : `We sent a 6-digit code to ${phone}`}
      </Text>

      <View style={styles.card}>
        {step === 'phone' ? (
          <>
            <Text style={styles.label}>Phone number</Text>
            <TextInput
              style={styles.input}
              placeholder="+972 50 000 0000"
              placeholderTextColor={Colors.textTertiary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.btn, phone.length < 8 && styles.btnDisabled]}
              disabled={phone.length < 8}
              onPress={() => setStep('code')}
            >
              <Text style={styles.btnText}>Continue</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Digit boxes */}
            <View style={styles.codeRow}>
              {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.digitBox,
                    digits[i] !== undefined && styles.digitBoxFilled,
                    i === digits.length && styles.digitBoxActive,
                  ]}
                >
                  <Text style={styles.digitText}>{digits[i] ?? '–'}</Text>
                </View>
              ))}
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            {/* Numpad */}
            <View style={styles.numpad}>
              {['1','2','3','4','5','6','7','8','9'].map(d => (
                <TouchableOpacity
                  key={d} style={styles.numKey}
                  onPress={() => enterDigit(d)} activeOpacity={0.7}
                >
                  <Text style={styles.numText}>{d}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.numKey} onPress={handleResend} activeOpacity={0.7}>
                <Text style={[styles.numText, { fontSize: FontSize.xs, color: Colors.teal }]}>Resend</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.numKey} onPress={() => enterDigit('0')} activeOpacity={0.7}>
                <Text style={styles.numText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.numKey} onPress={deleteDigit} activeOpacity={0.7}>
                <Text style={styles.numText}>⌫</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btn, digits.length < CODE_LENGTH && styles.btnDisabled]}
              disabled={digits.length < CODE_LENGTH || loading}
              onPress={handleVerify}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.btnText}>Verify code</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.bg, padding: Space.xl, paddingTop: 56 },
  backBtn:         { marginBottom: Space.lg },
  backText:        { fontSize: FontSize.sm, color: Colors.teal, fontWeight: FontWeight.medium },
  title:           { fontSize: FontSize.xl, fontWeight: FontWeight.semi, color: Colors.textPrimary, marginBottom: Space.xs, letterSpacing: -0.3 },
  subtitle:        { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Space.xl },
  card:            { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Space.xl, borderWidth: 0.5, borderColor: Colors.border, ...Shadow.card },
  label:           { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: Space.xs, letterSpacing: 0.4, textTransform: 'uppercase' },
  input:           { backgroundColor: Colors.bgSecondary, borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Space.md, paddingVertical: 11, fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Space.md },
  codeRow:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Space.md },
  digitBox:        { width: 44, height: 52, borderRadius: Radius.sm, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  digitBoxFilled:  { borderColor: Colors.teal, backgroundColor: Colors.tealLight },
  digitBoxActive:  { borderColor: Colors.teal, borderWidth: 2 },
  digitText:       { fontSize: FontSize.xl, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  errorText:       { fontSize: FontSize.xs, color: Colors.danger, marginBottom: Space.sm, textAlign: 'center' },
  numpad:          { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm, justifyContent: 'center', marginBottom: Space.lg },
  numKey:          { width: 72, height: 52, borderRadius: Radius.sm, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: Colors.border },
  numText:         { fontSize: FontSize.lg, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  btn:             { backgroundColor: Colors.teal, borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center' },
  btnDisabled:     { opacity: 0.45 },
  btnText:         { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.medium },
})
