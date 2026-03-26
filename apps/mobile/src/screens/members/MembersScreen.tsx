import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, RefreshControl, ActivityIndicator, Alert, Linking, Share,
} from 'react-native'
import { useRouter }        from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api }              from '../../services/api'
import { PermissionGate }   from '../../components/common/PermissionGate'
import { useAuth }          from '../../store/auth'
import type { FamilyMember } from '@familycart/shared'
import { Colors, FontSize, FontWeight, Radius, Space } from '../../utils/theme'
import StitchCard from '../../components/common/StitchCard'
import {
  isWhatsAppInstalled,
  openWhatsAppForGroupCreation,
  openWhatsAppGroup,
  isValidWhatsAppGroupLink,
} from '../../utils/whatsapp'

function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <View style={[styles.avatar, { backgroundColor: color + '22' }]}>
      <Text style={[styles.avatarText, { color }]}>{initials}</Text>
    </View>
  )
}

const AVATAR_COLORS = [Colors.teal, Colors.blue, '#D85A30', Colors.warning, '#993556']

export default function MembersScreen() {
  const router     = useRouter()
  const { user }   = useAuth()
  const qc         = useQueryClient()
  const [showInvite, setShowInvite] = useState(false)
  const [invite, setInvite] = useState({ name: '', phone: '', email: '', role: 'member' as 'admin' | 'member' })
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')

  // ─── WhatsApp group state ────────────────────────────────────
  const [showWaLinkModal, setShowWaLinkModal] = useState(false)
  const [waLinkInput, setWaLinkInput]         = useState('')
  const [hasWhatsApp, setHasWhatsApp]         = useState(true)

  useEffect(() => {
    isWhatsAppInstalled().then(setHasWhatsApp)
  }, [])

  const { data: members, isLoading, refetch, isRefetching } = useQuery<FamilyMember[]>({
    queryKey: ['members'],
    queryFn: () => api.get('/members').then(r => r.data),
  })

  // Fetch saved WhatsApp group link from server
  const { data: waGroupData, refetch: refetchWaGroup } = useQuery<{ link: string | null }>({
    queryKey: ['whatsapp-group'],
    queryFn: () => api.get('/members/whatsapp-group').then(r => r.data),
  })

  const waGroupLink = waGroupData?.link ?? null

  // Save WhatsApp group link mutation
  const saveWaLinkMutation = useMutation({
    mutationFn: (link: string) => api.put('/members/whatsapp-group', { link }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-group'] })
      setShowWaLinkModal(false)
      setWaLinkInput('')
      Alert.alert('✅ Saved', 'WhatsApp group linked! All family members can now open the group directly.')
    },
    onError: () => Alert.alert('Error', 'Failed to save WhatsApp group link.'),
  })

  // Remove WhatsApp group link mutation
  const removeWaLinkMutation = useMutation({
    mutationFn: () => api.delete('/members/whatsapp-group'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['whatsapp-group'] }),
  })

  // ─── WhatsApp handlers ──────────────────────────────────────
  const handleCreateWhatsAppGroup = async () => {
    if (!members?.length) return
    const activeMembers = members.filter(m => m.status === 'active')
    const phones = activeMembers
      .map(m => m.user?.phone ?? (m as any).phone)
      .filter(Boolean) as string[]
    const familyName = user?.fullName ? `${user.fullName}'s Family` : 'FamilyCart Group'
    await openWhatsAppForGroupCreation(familyName, phones)

    // After WhatsApp opens, prompt the user to save the group link
    setTimeout(() => {
      setShowWaLinkModal(true)
    }, 1000)
  }

  const handleOpenWhatsAppGroup = async () => {
    if (waGroupLink) {
      await openWhatsAppGroup(waGroupLink)
    }
  }

  const handleSaveWaLink = () => {
    const link = waLinkInput.trim()
    if (!isValidWhatsAppGroupLink(link)) {
      Alert.alert('Invalid Link', 'Please paste a valid WhatsApp group invite link (https://chat.whatsapp.com/...)')
      return
    }
    saveWaLinkMutation.mutate(link)
  }

  const handleRemoveWaGroup = () => {
    Alert.alert(
      'Remove WhatsApp Group',
      'Unlink the WhatsApp group from this family?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeWaLinkMutation.mutate() },
      ],
    )
  }

  const inviteMutation = useMutation({
    mutationFn: () => api.post('/auth/invite', {
      fullName: invite.name,
      phone: invite.phone,
      email: invite.email,
      role: invite.role,
    }),
    onSuccess: (res) => {
      setInviteUrl(res.data.inviteUrl ?? '')
      setInviteSent(true)
      qc.invalidateQueries({ queryKey: ['members'] })
    },
  })

  // ─── Set password state ─────────────────────────────────────
  const [showSetPassword, setShowSetPassword] = useState(false)
  const [passwordTarget, setPasswordTarget] = useState<{ userId: string; fullName: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const setPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      api.put('/auth/admin-set-password', { userId, password }),
    onSuccess: () => {
      Alert.alert('Success', `Password updated for ${passwordTarget?.fullName}`)
      setShowSetPassword(false)
      setNewPassword('')
      setPasswordTarget(null)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to update password'
      Alert.alert('Error', msg)
    },
  })

  const handleSetPassword = (m: FamilyMember) => {
    setPasswordTarget({ userId: m.userId, fullName: m.user.fullName })
    setNewPassword('')
    setShowSetPassword(true)
  }

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/members/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  })

  const confirmRemove = (m: FamilyMember) => {
    Alert.alert(
      'Remove member',
      `Remove ${m.user.fullName} from the family? They will lose access immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeMutation.mutate(m.id) },
      ]
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Family members</Text>
        <PermissionGate require="mem.invite">
          <TouchableOpacity style={styles.addBtn} onPress={() => { setShowInvite(true); setInviteSent(false) }}>
            <Text style={styles.addBtnText}>+ Invite</Text>
          </TouchableOpacity>
        </PermissionGate>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.teal} />}
      >
        {isLoading
          ? <ActivityIndicator color={Colors.teal} style={{ marginTop: Space.xl }} />
          : members?.map((m, i) => (
              <StitchCard key={m.id} style={styles.memberCard} contentStyle={styles.memberCardContent}>
                <Avatar name={m.user.fullName} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>{m.user.fullName}</Text>
                    {m.userId === user?.id && <Text style={styles.youBadge}>you</Text>}
                  </View>
                  <Text style={styles.memberPhone}>{m.user.phone}</Text>
                </View>
                <View style={styles.memberRight}>
                  <View style={[styles.roleBadge, m.role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeMember]}>
                    <Text style={[styles.roleBadgeText, m.role === 'admin' ? styles.roleBadgeTextAdmin : styles.roleBadgeTextMember]}>
                      {m.role}
                    </Text>
                  </View>
                  {m.status !== 'active' && (
                    <View style={styles.pendingBadge}><Text style={styles.pendingText}>{m.status}</Text></View>
                  )}
                </View>

                {/* Admin actions */}
                <PermissionGate require="mem.perms">
                  <View style={styles.memberActions}>
                    {m.userId !== user?.id && (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push(`/(tabs)/members/${m.id}/permissions`)}
                      >
                        <Text style={styles.actionBtnText}>Permissions</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleSetPassword(m)}
                    >
                      <Text style={styles.actionBtnText}>
                        {m.userId === user?.id ? 'Change My Password' : 'Set Password'}
                      </Text>
                    </TouchableOpacity>
                    {m.userId !== user?.id && (
                      <PermissionGate require="mem.remove">
                        <TouchableOpacity style={styles.removeBtn} onPress={() => confirmRemove(m)}>
                          <Text style={styles.removeBtnText}>Remove</Text>
                        </TouchableOpacity>
                      </PermissionGate>
                    )}
                  </View>
                </PermissionGate>
              </StitchCard>
            ))
        }

        {/* ─── WhatsApp Group Section ─────────────────────────── */}
        {hasWhatsApp && !isLoading && (
          <StitchCard style={styles.waSection} contentStyle={styles.waSectionContent}>
            <Text style={styles.waSectionTitle}>📱 WhatsApp Group</Text>

            {waGroupLink ? (
              <>
                <Text style={styles.waDescription}>
                  Family group is linked to WhatsApp. All members can open it directly.
                </Text>
                <TouchableOpacity style={styles.waOpenBtn} onPress={handleOpenWhatsAppGroup}>
                  <Text style={styles.waOpenBtnText}>💬 Open WhatsApp Group</Text>
                </TouchableOpacity>
                <PermissionGate require="mem.perms">
                  <View style={styles.waActions}>
                    <TouchableOpacity
                      style={styles.waChangeLinkBtn}
                      onPress={() => { setWaLinkInput(waGroupLink); setShowWaLinkModal(true) }}
                    >
                      <Text style={styles.waChangeLinkText}>Change link</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.waRemoveLinkBtn} onPress={handleRemoveWaGroup}>
                      <Text style={styles.waRemoveLinkText}>Unlink</Text>
                    </TouchableOpacity>
                  </View>
                </PermissionGate>
              </>
            ) : (
              <>
                <Text style={styles.waDescription}>
                  Create a WhatsApp group with all family members for quick communication.
                </Text>
                <TouchableOpacity style={styles.waCreateBtn} onPress={handleCreateWhatsAppGroup}>
                  <Text style={styles.waCreateBtnText}>📱 Create WhatsApp Group</Text>
                </TouchableOpacity>
                <PermissionGate require="mem.perms">
                  <TouchableOpacity
                    style={styles.waLinkExistingBtn}
                    onPress={() => { setWaLinkInput(''); setShowWaLinkModal(true) }}
                  >
                    <Text style={styles.waLinkExistingText}>Already have a group? Paste invite link</Text>
                  </TouchableOpacity>
                </PermissionGate>
              </>
            )}
          </StitchCard>
        )}
      </ScrollView>

      {/* WhatsApp group link modal */}
      <Modal visible={showWaLinkModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalBg}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Link WhatsApp Group</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                1. Open WhatsApp → your family group{'\n'}
                2. Tap group name → Invite via link → Copy link{'\n'}
                3. Paste the link below
              </Text>
            </View>
            <Text style={styles.label}>Group invite link</Text>
            <TextInput
              style={styles.input}
              placeholder="https://chat.whatsapp.com/..."
              placeholderTextColor={Colors.textTertiary}
              value={waLinkInput}
              onChangeText={setWaLinkInput}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <View style={styles.sheetBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowWaLinkModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !waLinkInput.trim() && styles.btnDisabled]}
                disabled={!waLinkInput.trim() || saveWaLinkMutation.isPending}
                onPress={handleSaveWaLink}
              >
                {saveWaLinkMutation.isPending
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.saveBtnText}>Save Link</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Set Password modal */}
      <Modal visible={showSetPassword} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalBg}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Set Password</Text>
            <Text style={styles.label}>New password for {passwordTarget?.fullName}</Text>
            <TextInput
              style={styles.input}
              placeholder="Min 8 characters"
              placeholderTextColor={Colors.textTertiary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoFocus
            />
            <View style={styles.sheetBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowSetPassword(false); setNewPassword('') }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, newPassword.length < 8 && styles.btnDisabled]}
                disabled={newPassword.length < 8 || setPasswordMutation.isPending}
                onPress={() => passwordTarget && setPasswordMutation.mutate({ userId: passwordTarget.userId, password: newPassword })}
              >
                {setPasswordMutation.isPending
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.saveBtnText}>Save Password</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Invite modal */}
      <Modal visible={showInvite} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalBg}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            {inviteSent ? (
              <View style={{ alignItems: 'center', paddingVertical: Space.lg }}>
                <View style={styles.sentCircle}><Text style={{ fontSize: 28 }}>🔗</Text></View>
                <Text style={styles.sentTitle}>Invite created!</Text>
                <Text style={styles.sentBody}>
                  Share this link with {invite.name} so they can set their password and join the family.
                </Text>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: '#25D366', marginBottom: Space.sm }]}
                  onPress={() => Linking.openURL(`https://wa.me/?text=${encodeURIComponent(`You're invited to FamilyCart! Set your password here: ${inviteUrl}`)}`)}
                >
                  <Text style={styles.saveBtnText}>Share via WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: Colors.blue, marginBottom: Space.sm }]}
                  onPress={() => Share.share({ message: `You're invited to FamilyCart! Set your password here: ${inviteUrl}` })}
                >
                  <Text style={styles.saveBtnText}>Share link</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowInvite(false)}>
                  <Text style={styles.cancelBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.sheetTitle}>Invite member</Text>
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    You'll get a link to share with them. They'll use it to set their password and join.
                  </Text>
                </View>

                <Text style={styles.label}>Full name</Text>
                <TextInput style={styles.input} placeholder="Dan Levi"
                  placeholderTextColor={Colors.textTertiary}
                  value={invite.name} onChangeText={t => setInvite(i => ({ ...i, name: t }))} autoFocus />

                <Text style={styles.label}>Phone number</Text>
                <TextInput style={styles.input} placeholder="+972 50 000 0000"
                  placeholderTextColor={Colors.textTertiary}
                  value={invite.phone} onChangeText={t => setInvite(i => ({ ...i, phone: t }))}
                  keyboardType="phone-pad" />

                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} placeholder="name@example.com"
                  placeholderTextColor={Colors.textTertiary}
                  value={invite.email} onChangeText={t => setInvite(i => ({ ...i, email: t }))}
                  keyboardType="email-address" autoCapitalize="none" />

                <Text style={styles.label}>Role</Text>
                <View style={styles.roleRow}>
                  {(['admin', 'member'] as const).map(r => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.rolePill, invite.role === r && styles.rolePillActive]}
                      onPress={() => setInvite(i => ({ ...i, role: r }))}
                    >
                      <Text style={[styles.rolePillName, invite.role === r && styles.rolePillNameActive]}>
                        {r === 'admin' ? 'Admin' : 'Member'}
                      </Text>
                      <Text style={styles.rolePillSub}>
                        {r === 'admin' ? 'Full control' : 'Shop & track'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.sheetBtns}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowInvite(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, (!invite.name || !invite.phone || !invite.email) && styles.btnDisabled]}
                    disabled={!invite.name || !invite.phone || !invite.email || inviteMutation.isPending}
                    onPress={() => inviteMutation.mutate()}
                  >
                    {inviteMutation.isPending
                      ? <ActivityIndicator color={Colors.white} />
                      : <Text style={styles.saveBtnText}>Create invite</Text>
                    }
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: Colors.bg },
  header:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.lg, paddingTop: 56, paddingBottom: Space.md, backgroundColor: Colors.teal },
  headerTitle:       { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.semi, color: Colors.white },
  addBtn:            { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full, paddingHorizontal: Space.md, paddingVertical: 6 },
  addBtnText:        { fontSize: FontSize.sm, color: Colors.white, fontWeight: FontWeight.medium },
  content:           { padding: Space.lg, paddingBottom: 80 },
  memberCard:        { marginBottom: Space.sm },
  memberCardContent: { padding: Space.md },
  avatar:            { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: Space.md, left: Space.md },
  avatarText:        { fontSize: FontSize.sm, fontWeight: FontWeight.semi },
  memberInfo:        { marginLeft: 52, flex: 1, paddingRight: Space.lg },
  memberNameRow:     { flexDirection: 'row', alignItems: 'center', gap: Space.xs },
  memberName:        { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  youBadge:          { fontSize: FontSize.xs, color: Colors.textTertiary },
  memberPhone:       { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  memberRight:       { position: 'absolute', top: Space.md, right: Space.md, alignItems: 'flex-end', gap: Space.xs },
  roleBadge:         { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  roleBadgeAdmin:    { backgroundColor: Colors.tealLight },
  roleBadgeMember:   { backgroundColor: Colors.blueLight },
  roleBadgeText:     { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  roleBadgeTextAdmin:{ color: Colors.tealDark },
  roleBadgeTextMember:{ color: Colors.blue },
  pendingBadge:      { backgroundColor: Colors.warningLight, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  pendingText:       { fontSize: FontSize.xs, color: Colors.warning, fontWeight: FontWeight.medium },
  memberActions:     { flexDirection: 'row', gap: Space.xs, marginTop: Space.sm, marginLeft: 52, paddingTop: Space.sm, borderTopWidth: 0.5, borderTopColor: Colors.border },
  actionBtn:         { backgroundColor: Colors.blueLight, borderRadius: Radius.sm, paddingHorizontal: Space.sm, paddingVertical: 5 },
  actionBtnText:     { fontSize: FontSize.xs, color: Colors.blue, fontWeight: FontWeight.medium },
  removeBtn:         { backgroundColor: Colors.dangerLight, borderRadius: Radius.sm, paddingHorizontal: Space.sm, paddingVertical: 5 },
  removeBtnText:     { fontSize: FontSize.xs, color: Colors.danger, fontWeight: FontWeight.medium },
  modalBg:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:             { backgroundColor: Colors.bgCard, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Space.xl, paddingBottom: 40 },
  sheetHandle:       { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Space.lg },
  sheetTitle:        { fontSize: FontSize.lg, fontWeight: FontWeight.medium, color: Colors.textPrimary, marginBottom: Space.md },
  infoBox:           { backgroundColor: Colors.tealLight, borderRadius: Radius.sm, padding: Space.md, marginBottom: Space.lg },
  infoText:          { fontSize: FontSize.sm, color: Colors.tealDark, lineHeight: 20 },
  label:             { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: Space.xs, textTransform: 'uppercase', letterSpacing: 0.4 },
  input:             { backgroundColor: Colors.bgSecondary, borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Space.md, paddingVertical: 11, fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Space.md },
  roleRow:           { flexDirection: 'row', gap: Space.sm, marginBottom: Space.lg },
  rolePill:          { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Space.md },
  rolePillActive:    { borderColor: Colors.teal, backgroundColor: Colors.tealLight },
  rolePillName:      { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  rolePillNameActive:{ color: Colors.tealDark },
  rolePillSub:       { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  sheetBtns:         { flexDirection: 'row', gap: Space.sm },
  cancelBtn:         { flex: 1, borderWidth: 0.5, borderColor: Colors.borderMid, borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center' },
  cancelBtnText:     { fontSize: FontSize.md, color: Colors.textSecondary },
  saveBtn:           { flex: 1, backgroundColor: Colors.teal, borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center' },
  saveBtnText:       { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.medium },
  btnDisabled:       { opacity: 0.45 },
  sentCircle:        { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.blueLight, alignItems: 'center', justifyContent: 'center', marginBottom: Space.lg },
  sentTitle:         { fontSize: FontSize.lg, fontWeight: FontWeight.medium, color: Colors.textPrimary, marginBottom: Space.xs },
  sentBody:          { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Space.xl },

  // ─── WhatsApp group styles ──────────────────────────────────
  waSection:         { marginTop: Space.lg },
  waSectionContent:  { padding: Space.lg },
  waSectionTitle:    { fontSize: FontSize.md, fontWeight: FontWeight.semi, color: Colors.textPrimary, marginBottom: Space.sm },
  waDescription:     { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Space.md },
  waCreateBtn:       { backgroundColor: '#25D366', borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center' },
  waCreateBtnText:   { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.medium },
  waOpenBtn:         { backgroundColor: '#25D366', borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center' },
  waOpenBtnText:     { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.medium },
  waLinkExistingBtn: { marginTop: Space.sm, alignItems: 'center', paddingVertical: Space.sm },
  waLinkExistingText:{ fontSize: FontSize.sm, color: Colors.teal, fontWeight: FontWeight.medium },
  waActions:         { flexDirection: 'row', justifyContent: 'center', gap: Space.md, marginTop: Space.sm },
  waChangeLinkBtn:   { paddingVertical: Space.xs, paddingHorizontal: Space.sm },
  waChangeLinkText:  { fontSize: FontSize.xs, color: Colors.blue, fontWeight: FontWeight.medium },
  waRemoveLinkBtn:   { paddingVertical: Space.xs, paddingHorizontal: Space.sm },
  waRemoveLinkText:  { fontSize: FontSize.xs, color: Colors.danger, fontWeight: FontWeight.medium },
})
