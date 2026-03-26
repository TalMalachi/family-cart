import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useMutation } from '@tanstack/react-query'
import { api }        from '../../services/api'
import { useAuth }    from '../../store/auth'
import { Colors, FontSize, FontWeight, Radius, Space, Shadow, Gradients } from '../../utils/theme'
import StitchCard     from '../../components/common/StitchCard'
import GradientHeader from '../../components/common/GradientHeader'

export default function ProfileScreen() {
  const { user, logout } = useAuth()

  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [phone, setPhone]       = useState('')
  const [email, setEmail]       = useState('')
  const [loaded, setLoaded]     = useState(false)

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
      <GradientHeader title="Profile" />

      <ScrollView contentContainerStyle={styles.content}>
        {!loaded ? (
          <ActivityIndicator color={Colors.teal} style={{ marginTop: Space.xl }} />
        ) : (
          <>
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <LinearGradient
                colors={Gradients.tealExt as unknown as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {(fullName || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </LinearGradient>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{user?.role ?? 'member'}</Text>
              </View>
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
                <LinearGradient
                  colors={Gradients.teal as unknown as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtnInner}
                >
                  {updateMutation.isPending
                    ? <ActivityIndicator color={Colors.white} />
                    : <Text style={styles.saveBtnText}>Save changes</Text>
                  }
                </LinearGradient>
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
                <LinearGradient
                  colors={Gradients.teal as unknown as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtnInner}
                >
                  {changePwMutation.isPending
                    ? <ActivityIndicator color={Colors.white} />
                    : <Text style={styles.saveBtnText}>Change password</Text>
                  }
                </LinearGradient>
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
  content:        { padding: Space.lg, paddingBottom: 100 },
  avatarSection:  { alignItems: 'center', marginBottom: Space.xl },
  avatar:         { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Space.sm, ...Shadow.glow },
  avatarText:     { fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white },
  roleBadge:      { backgroundColor: Colors.tealLight, borderRadius: Radius.full, paddingHorizontal: Space.md, paddingVertical: Space.xs },
  roleBadgeText:  { fontSize: FontSize.xs, fontWeight: FontWeight.semi, color: Colors.teal, textTransform: 'capitalize' },
  card:           { marginBottom: Space.lg },
  cardContent:    { padding: Space.lg },
  sectionTitle:   { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Space.lg },
  label:          { fontSize: FontSize.xs, fontWeight: FontWeight.semi, color: Colors.textSecondary, marginBottom: 4, marginTop: Space.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:          { backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Space.lg, paddingVertical: 14, fontSize: FontSize.md, color: Colors.textPrimary },
  saveBtn:        { borderRadius: Radius.sm, overflow: 'hidden', marginTop: Space.lg },
  saveBtnInner:   { paddingVertical: 14, alignItems: 'center', borderRadius: Radius.sm },
  saveBtnText:    { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semi },
  btnDisabled:    { opacity: 0.5 },
  logoutBtn:      { backgroundColor: Colors.dangerLight, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', marginTop: Space.sm },
  logoutBtnText:  { color: Colors.danger, fontSize: FontSize.md, fontWeight: FontWeight.semi },
})