import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, ActivityIndicator, Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api }               from '../../services/api'
import { PERMISSION_GROUPS, ALL_PERMISSIONS } from '@familycart/shared/permissions'
import type { PermissionKey } from '@familycart/shared'
import { Colors, FontSize, FontWeight, Radius, Space, Shadow } from '../../utils/theme'

interface MemberPerms {
  memberId: string
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
      // Merge pending into existing overrides
      const existingMap: OverrideMap = {}
      data?.overrides.forEach(o => { existingMap[o.permissionKey] = o.granted })
      const merged = { ...existingMap, ...pending }

      // Only send non-default overrides
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{data.fullName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{data.role}</Text>
          </View>
        </View>
      </View>

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
            <View style={styles.groupCard}>
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
            </View>
          </View>
        ))}

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
            style={[styles.saveBtn, !hasChanges && styles.btnDisabled]}
            disabled={!hasChanges || saveMutation.isPending}
            onPress={() => saveMutation.mutate()}
          >
            {saveMutation.isPending
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <Text style={styles.saveBtnText}>
                  Save{hasChanges ? ` (${Object.keys(pending).length})` : ''}
                </Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.bg },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:        { backgroundColor: Colors.teal, paddingHorizontal: Space.lg, paddingTop: 56, paddingBottom: Space.md },
  backText:      { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', fontWeight: FontWeight.medium, marginBottom: Space.sm },
  headerInfo:    { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  headerName:    { fontSize: FontSize.lg, fontWeight: FontWeight.semi, color: Colors.white, flex: 1 },
  roleBadge:     { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full, paddingHorizontal: Space.sm, paddingVertical: 3 },
  roleBadgeText: { fontSize: FontSize.xs, color: Colors.white, fontWeight: FontWeight.medium },
  content:       { padding: Space.lg, paddingBottom: 100 },
  infoBanner:    { backgroundColor: Colors.blueLight, borderRadius: Radius.sm, padding: Space.md, marginBottom: Space.lg },
  infoText:      { fontSize: FontSize.sm, color: Colors.blue, lineHeight: 20 },
  group:         { marginBottom: Space.lg },
  groupTitle:    { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Space.sm },
  groupCard:     { backgroundColor: Colors.bgCard, borderRadius: Radius.md, borderWidth: 0.5, borderColor: Colors.border, overflow: 'hidden', ...Shadow.card },
  permRow:       { flexDirection: 'row', alignItems: 'center', padding: Space.md, gap: Space.sm },
  permRowBorder: { borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  permInfo:      { flex: 1 },
  permNameRow:   { flexDirection: 'row', alignItems: 'center', gap: Space.xs, flexWrap: 'wrap' },
  permName:      { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium, flexShrink: 1 },
  permKey:       { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2, fontFamily: 'monospace' },
  srcBadge:      { borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 1 },
  srcText:       { fontSize: 10, fontWeight: FontWeight.medium },
  actionBar:     { flexDirection: 'row', gap: Space.sm, marginTop: Space.sm },
  resetBtn:      { flex: 1, borderWidth: 0.5, borderColor: Colors.borderMid, borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center' },
  resetBtnText:  { fontSize: FontSize.sm, color: Colors.textSecondary },
  saveBtn:       { flex: 1, backgroundColor: Colors.teal, borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center' },
  saveBtnText:   { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.medium },
  btnDisabled:   { opacity: 0.45 },
})
