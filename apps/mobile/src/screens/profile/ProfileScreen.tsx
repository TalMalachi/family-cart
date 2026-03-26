import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator,
} from 'react-native'
import { useMutation } from '@tanstack/react-query'
import { api }        from '../../services/api'
import { useAuth }    from '../../store/auth'
import { Colors, FontSize, FontWeight, Radius, Space } from '../../utils/theme'
import StitchCard     from '../../components/common/StitchCard'

export default function ProfileScreen() {
  const { user, logout } = useAuth()

  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [phone, setPhone]       = useState('')
  const [email, setEmail]       = useState('')
  const [loaded, setLoaded]     = useState(false)

  // Load current user info from server
  useEffect(() => {
    api.get('/auth/profile').then(res => {
      setFullName(res.data.fullName ?? '')
      setPhone(res.data.phone ?? '')
      setEmail(res.data.email ?? '')
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  const updateMutation = useMutation({
    mutationFn: (data: { fullName?: string; phone?: string; email?: string }) =>
      api.patch('/auth/profile', data),
    onSuccess: (res) => {
      setFullName(res.data.fullName ?? fullName)
      setPhone(res.data.phone ?? phone)
      setEmail(res.data.email ?? email)
      Alert.alert('Saved', 'Your profile has been updated.')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to update profile'
      Alert.alert('Error', msg)
    },
  })

  const handleSave = () => {
    const data: Record<string, string> = {}
    if (fullName.trim()) data.fullName = fullName.trim()
    if (phone.trim())    data.phone = phone.trim()
    if (email.trim())    data.email = email.trim()

    if (Object.keys(data).length === 0) {
      Alert.alert('No changes', 'Please fill in at least one field.')
      return
    }
    updateMutation.mutate(data)
  }

  // ─── Change password ────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  const changePwMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.put('/auth/change-password', data),
    onSuccess: () => {
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      Alert.alert('Success', 'Password changed successfully.')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to change password'
      Alert.alert('Error', msg)
    },
  })

  const handleChangePassword = () => {
    if (!currentPw || !newPw) {
      Alert.alert('Error', 'Please fill in all password fields.')
      return
    }
    if (newPw.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters.')
      return
    }
    if (newPw !== confirmPw) {
      Alert.alert('Error', 'New passwords do not match.')
      return
    }
    changePwMutation.mutate({ currentPassword: currentPw, newPassword: newPw })
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ])
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!loaded ? (
          <ActivityIndicator color={Colors.teal} style={{ marginTop: Space.xl }} />
        ) : (
          <>
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(fullName || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.roleBadge}>{user?.role ?? 'member'}</Text>
            </View>

            {/* Form */}
            <StitchCard style={styles.card} contentStyle={styles.cardContent}>
              <Text style={styles.sectionTitle}>Your information</Text>

              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your name"
                placeholderTextColor={Colors.textTertiary}
              />

              <Text style={styles.label}>Phone number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+972 50 000 0000"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.saveBtn, updateMutation.isPending && styles.btnDisabled]}
                disabled={updateMutation.isPending}
                onPress={handleSave}
              >
                {updateMutation.isPending
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.saveBtnText}>Save changes</Text>
                }
              </TouchableOpacity>
            </StitchCard>

            {/* Change password */}
            <StitchCard style={styles.card} contentStyle={styles.cardContent}>
              <Text style={styles.sectionTitle}>Change password</Text>

              <Text style={styles.label}>Current password</Text>
              <TextInput
                style={styles.input}
                value={currentPw}
                onChangeText={setCurrentPw}
                placeholder="Enter current password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
              />

              <Text style={styles.label}>New password</Text>
              <TextInput
                style={styles.input}
                value={newPw}
                onChangeText={setNewPw}
                placeholder="Min 8 characters"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
              />

              <Text style={styles.label}>Confirm new password</Text>
              <TextInput
                style={styles.input}
                value={confirmPw}
                onChangeText={setConfirmPw}
                placeholder="Repeat new password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.saveBtn, changePwMutation.isPending && styles.btnDisabled]}
                disabled={changePwMutation.isPending}
                onPress={handleChangePassword}
              >
                {changePwMutation.isPending
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.saveBtnText}>Change password</Text>
                }
              </TouchableOpacity>
            </StitchCard>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>Logout</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.bg },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.lg, paddingTop: 56, paddingBottom: Space.md, backgroundColor: Colors.teal },
  headerTitle:    { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.semi, color: Colors.white },
  content:        { padding: Space.lg, paddingBottom: 80 },
  avatarSection:  { alignItems: 'center', marginBottom: Space.lg },
  avatar:         { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.tealLight, alignItems: 'center', justifyContent: 'center', marginBottom: Space.sm },
  avatarText:     { fontSize: 24, fontWeight: FontWeight.semi, color: Colors.tealDark },
  roleBadge:      { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary, textTransform: 'capitalize' },
  card:           { marginBottom: Space.lg },
  cardContent:    { padding: Space.md },
  sectionTitle:   { fontSize: FontSize.md, fontWeight: FontWeight.semi, color: Colors.textPrimary, marginBottom: Space.md },
  label:          { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: 4, marginTop: Space.sm },
  input:          { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, padding: Space.sm, fontSize: FontSize.md, color: Colors.textPrimary },
  saveBtn:        { backgroundColor: Colors.teal, borderRadius: Radius.sm, paddingVertical: 12, alignItems: 'center', marginTop: Space.lg },
  saveBtnText:    { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semi },
  btnDisabled:    { opacity: 0.5 },
  logoutBtn:      { backgroundColor: Colors.dangerLight, borderRadius: Radius.sm, paddingVertical: 12, alignItems: 'center', marginTop: Space.sm },
  logoutBtnText:  { color: Colors.danger, fontSize: FontSize.md, fontWeight: FontWeight.semi },
})