import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, ActivityIndicator, Alert, TextInput,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api }               from '../../services/api'
import { PERMISSION_GROUPS, ALL_PERMISSIONS } from '@familycart/shared/permissions'
import type { PermissionKey } from '@familycart/shared'
import { Colors, FontSize, FontWeight, Radius, Space, Shadow, Gradients } from '../../utils/theme'
import StitchCard from '../../components/common/StitchCard'

interface MemberPerms {
  memberId: string
  userId: string
  fullName: string
  role: 'admin' | 'member'
  roleDefaults: PermissionKey[]
  overrides: { permissionKey: PermissionKey; granted: boolean }[]
  resolved: PermissionKey[]
}

type OverrideMap = Partial<Record<PermissionKey, boolean>>

function sourceLabel(
  key: PermissionKey,
  roleDefaults: PermissionKey[],
  overrides: MemberPerms['overrides'],
  pending: OverrideMap
): { text: string; color: string } {
  const isDefault = roleDefaults.includes(key)
  if (key in pending) {
    const val = pending[key]
    if (val === isDefault) return { text: 'role default', color: Colors.textTertiary }
    return val
      ? { text: 'granted', color: Colors.teal }
      : { text: 'revoked', color: Colors.danger }
  }
  const override = overrides.find(o => o.permissionKey === key)
  if (override) {
    return override.granted === isDefault
      ? { text: 'role default', color: Colors.textTertiary }
      : override.granted
        ? { text: 'granted', color: Colors.teal }
        : { text: 'revoked', color: Colors.danger }
  }
  return { text: 'role default', color: Colors.textTertiary }
}

export default function PermissionsManagerScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>()
  const router       = useRouter()

  const { data, isLoading, refetch } = useQuery<MemberPerms>({
    queryKey: ['member-perms', memberId],
    queryFn:  () => api.get(`/permissions/member/${memberId}`).then(r => r.data),
  })

  const [pending, setPending] = useState<OverrideMap>({})
  const hasChanges = Object.keys(pending).length > 0

  const saveMutation = useMutation({
    mutationFn: () => {
      const existingMap: OverrideMap = {}
      data?.overrides.forEach(o => { existingMap[o.permissionKey] = o.granted })
      const merged = { ...existingMap, ...pending }

      const overrides = Object.entries(merged)
        .filter(([key, val]) => val !== data?.roleDefaults.includes(key as PermissionKey))
        .map(([permissionKey, granted]) => ({ permissionKey, granted }))

      return api.put(`/permissions/member/${memberId}`, { familyMemberId: memberId, overrides })
    },
    onSuccess: () => {
      setPending({})
      refetch()
      Alert.alert('Saved', 'Permissions updated successfully.')
    },
  })

  const resetMutation = useMutation({
    mutationFn: () => api.delete(`/permissions/member/${memberId}/reset`),
    onSuccess: () => { setPending({}); refetch() },
  })

  const [newPassword, setNewPassword] = useState('')

  const setPasswordMutation = useMutation({
    mutationFn: (password: string) =>
      api.put('/auth/admin-set-password', { userId: data?.userId, password }),
    onSuccess: () => {
      Alert.alert('Success', `Password updated for ${data?.fullName}`)
      setNewPassword('')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to update password'
      Alert.alert('Error', msg)
    },
  })

  const getEffective = (key: PermissionKey): boolean => {
    if (key in pending) return pending[key]!
    const o = data?.overrides.find(o => o.permissionKey === key)
    if (o) return o.granted
    return data?.roleDefaults.includes(key) ?? false
  }

  const toggle = (key: PermissionKey) => {
    const current  = getEffective(key)
    const isDefault = data?.roleDefaults.includes(key) ?? false
    const next     = !current

    setPending(p => {
      const updated = { ...p }
      if (next === isDefault) delete updated[key]
      else updated[key] = next
      return updated
    })
  }

  const confirmReset = () => {
    Alert.alert(
      'Reset permissions',
      `Reset ${data?.fullName} to role defaults? All custom overrides will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetMutation.mutate() },
      ]
    )
  }

  if (isLoading || !data) {
    return <View style={styles.center}><ActivityIndicator color={Colors.teal} size="large" /></View>
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Gradients.teal as unknown as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{data.fullName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{data.role}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            Overrides add or remove individual permissions beyond the {data.role} role defaults.
            Changes take effect immediately.
          </Text>
        </View>

        {PERMISSION_GROUPS.map(group => (
          <View key={group.api} style={styles.group}>
            <Text style={styles.groupTitle}>{group.label}</Text>
            <StitchCard>
              {group.keys.map((key, i) => {
                const info = ALL_PERMISSIONS[key]
                const effective = getEffective(key)
                const src = sourceLabel(key, data.roleDefaults, data.overrides, pending)
                const isLast = i === group.keys.length - 1

                return (
                  <View key={key} style={[styles.permRow, !isLast && styles.permRowBorder]}>
                    <View style={styles.permInfo}>
                      <View style={styles.permNameRow}>
                        <Text style={styles.permName}>{info.description}</Text>
                        <View style={[styles.srcBadge, { backgroundColor: src.color + '18' }]}>
                          <Text style={[styles.srcText, { color: src.color }]}>{src.text}</Text>
                        </View>
                      </View>
                      <Text style={styles.permKey}>{key}</Text>
                    </View>
                    <Switch
                      value={effective}
                      onValueChange={() => toggle(key)}
                      trackColor={{ false: Colors.bgSecondary, true: Colors.tealLight }}
                      thumbColor={effective ? Colors.teal : Colors.textTertiary}
                      ios_backgroundColor={Colors.bgSecondary}
                    />
                  </View>
                )
              })}
            </StitchCard>
          </View>
        ))}

        {/* Set password section */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Set Password</Text>
          <StitchCard contentStyle={{ padding: Space.lg }}>
            <Text style={styles.passwordHint}>
              Set a new password for {data.fullName}. Minimum 8 characters.
            </Text>
            <TextInput
              style={styles.passwordInput}
              placeholder="New password"
              placeholderTextColor={Colors.textTertiary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={[styles.passwordBtn, newPassword.length < 8 && styles.btnDisabled]}
              disabled={newPassword.length < 8 || setPasswordMutation.isPending}
              onPress={() => setPasswordMutation.mutate(newPassword)}
            >
              <LinearGradient
                colors={Gradients.teal as unknown as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.passwordBtnInner}
              >
                {setPasswordMutation.isPending
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={styles.passwordBtnText}>Update Password</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </StitchCard>
        </View>

        {/* Save / reset bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={confirmReset}
            disabled={resetMutation.isPending}
          >
            <Text style={styles.resetBtnText}>Reset to role defaults</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveActionBtn, !hasChanges && styles.btnDisabled]}
            disabled={!hasChanges || saveMutation.isPending}
            onPress={() => saveMutation.mutate()}
          >
            <LinearGradient
              colors={Gradients.teal as unknown as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveActionBtnInner}
            >
              {saveMutation.isPending
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={styles.saveBtnText}>
                    Save{hasChanges ? ` (${Object.keys(pending).length})` : ''}
                  </Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.bg },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:        { paddingHorizontal: Space.xl, paddingTop: 60, paddingBottom: Space.lg },
  backBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: Space.sm },
  backText:      { fontSize: FontSize.lg, color: Colors.white },
  headerInfo:    { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  headerName:    { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white, flex: 1 },
  roleBadge:     { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full, paddingHorizontal: Space.md, paddingVertical: 4 },
  roleBadgeText: { fontSize: FontSize.xs, color: Colors.white, fontWeight: FontWeight.semi },
  content:       { padding: Space.lg, paddingBottom: 100 },
  infoBanner:    { backgroundColor: Colors.blueLight, borderRadius: Radius.md, padding: Space.lg, marginBottom: Space.xl },
  infoText:      { fontSize: FontSize.sm, color: Colors.blue, lineHeight: 22 },
  group:         { marginBottom: Space.xl },
  groupTitle:    { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Space.sm },
  permRow:       { flexDirection: 'row', alignItems: 'center', padding: Space.lg, gap: Space.md },
  permRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  permInfo:      { flex: 1 },
  permNameRow:   { flexDirection: 'row', alignItems: 'center', gap: Space.xs, flexWrap: 'wrap' },
  permName:      { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.semi, flexShrink: 1 },
  permKey:       { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 3, fontFamily: 'monospace' },
  srcBadge:      { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  srcText:       { fontSize: 10, fontWeight: FontWeight.semi },
  actionBar:     { flexDirection: 'row', gap: Space.md, marginTop: Space.sm },
  resetBtn:      { flex: 1, borderWidth: 1.5, borderColor: Colors.borderMid, borderRadius: Radius.sm, paddingVertical: 15, alignItems: 'center' },
  resetBtnText:  { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  saveActionBtn: { flex: 1, borderRadius: Radius.sm, overflow: 'hidden' },
  saveActionBtnInner: { paddingVertical: 15, alignItems: 'center', borderRadius: Radius.sm },
  saveBtnText:   { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.semi },
  btnDisabled:   { opacity: 0.45 },
  passwordHint:  { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Space.md, lineHeight: 22 },
  passwordInput: { backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Space.lg, paddingVertical: 14, fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Space.md },
  passwordBtn:   { borderRadius: Radius.sm, overflow: 'hidden' },
  passwordBtnInner: { paddingVertical: 14, alignItems: 'center', borderRadius: Radius.sm },
  passwordBtnText: { fontSize: FontSize.sm, color: Colors.white, fontWeight: FontWeight.semi },
})