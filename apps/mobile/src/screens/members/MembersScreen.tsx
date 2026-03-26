import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, RefreshControl, ActivityIndicator, Alert, Linking, Share,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter }        from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api }              from '../../services/api'
import { PermissionGate }   from '../../components/common/PermissionGate'
import { useAuth }          from '../../store/auth'
import type { FamilyMember } from '@familycart/shared'
import { Colors, FontSize, FontWeight, Radius, Space, Shadow, Gradients } from '../../utils/theme'
import StitchCard from '../../components/common/StitchCard'
import GradientHeader from '../../components/common/GradientHeader'
import {
  isWhatsAppInstalled,
  openWhatsAppForGroupCreation,
  openWhatsAppGroup,
  isValidWhatsAppGroupLink,
  sendWhatsAppMessage,
} from '../../utils/whatsapp'

function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <View style={[styles.avatar, { backgroundColor: color + '18' }]}>
      <Text style={[styles.avatarText, { color }]}>{initials}</Text>
    </View>
  )
}

const AVATAR_COLORS = [Colors.teal, Colors.blue, '#E11D48', Colors.amber, '#8B5CF6']

export default function MembersScreen() {
  const router     = useRouter()
  const { user }   = useAuth()
  const qc         = useQueryClient()
  const [showInvite, setShowInvite] = useState(false)
  const [invite, setInvite] = useState({ name: '', phone: '', email: '', role: 'member' as 'admin' | 'member' })
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')

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

  const { data: waGroupData, refetch: refetchWaGroup } = useQuery<{ link: string | null }>({
    queryKey: ['whatsapp-group'],
    queryFn: () => api.get('/members/whatsapp-group').then(r => r.data),
  })

  const waGroupLink = waGroupData?.link ?? null

  const saveWaLinkMutation = useMutation({
    mutationFn: (link: string) => api.put('/members/whatsapp-group', { link }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-group'] })
      setShowWaLinkModal(false)
      setWaLinkInput('')
      Alert.alert('Saved', 'WhatsApp group linked! All family members can now open the group directly.')
    },
    onError: () => Alert.alert('Error', 'Failed to save WhatsApp group link.'),
  })

  const removeWaLinkMutation = useMutation({
    mutationFn: () => api.delete('/members/whatsapp-group'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['whatsapp-group'] }),
  })

  const handleCreateWhatsAppGroup = async () => {
    if (!members?.length) return
    const activeMembers = members.filter(m => m.status === 'active')
    const phones = activeMembers
      .map(m => m.user?.phone ?? (m as any).phone)
      .filter(Boolean) as string[]
    const familyName = user?.fullName ? `${user.fullName}'s Family` : 'FamilyCart Group'
    await openWhatsAppForGroupCreation(familyName, phones)
    setTimeout(() => { setShowWaLinkModal(true) }, 1000)
  }

  const handleOpenWhatsAppGroup = async () => {
    if (waGroupLink) await openWhatsAppGroup(waGroupLink)
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

  const resendInviteMutation = useMutation({
    mutationFn: (userId: string) => api.post('/auth/invite/resend', { userId }),
    onSuccess: async (res) => {
      const { inviteUrl, phone, fullName } = res.data
      const message = `Hi ${fullName}! You're invited to FamilyCart. Set your password here: ${inviteUrl}`
      await sendWhatsAppMessage(phone, message)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to resend invitation'
      Alert.alert('Error', msg)
    },
  })

  const handleResendInvite = (m: FamilyMember) => {
    Alert.alert(
      'Resend Invitation',
      `Resend invite to ${m.user.fullName} via WhatsApp?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Resend', onPress: () => resendInviteMutation.mutate(m.userId) },
      ],
    )
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
      <GradientHeader title="Family members">
        <PermissionGate require="mem.invite">
          <TouchableOpacity style={styles.addBtn} onPress={() => { setShowInvite(true); setInviteSent(false) }}>
            <Text style={styles.addBtnText}>+ Invite</Text>
          </TouchableOpacity>
        </PermissionGate>
      </GradientHeader>

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
                    {m.userId !== user?.id && m.mustChangePassword && hasWhatsApp && (
                      <TouchableOpacity
                        style={styles.resendBtn}
                        onPress={() => handleResendInvite(m)}
                        disabled={resendInviteMutation.isPending}
                      >
                        {resendInviteMutation.isPending
                          ? <ActivityIndicator color={Colors.white} size="small" />
                          : <Text style={styles.resendBtnText}>Resend via WhatsApp</Text>
                        }
                      </TouchableOpacity>
                    )}
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

        {/* WhatsApp Group Section */}
        {hasWhatsApp && !isLoading && (
          <StitchCard style={styles.waSection} contentStyle={styles.waSectionContent} variant="elevated">
            <Text style={styles.waSectionTitle}>WhatsApp Group</Text>

            {waGroupLink ? (
              <>
                <Text style={styles.waDescription}>
                  Family group is linked to WhatsApp. All members can open it directly.
                </Text>
                <TouchableOpacity style={styles.waOpenBtn} onPress={handleOpenWhatsAppGroup}>
                  <Text style={styles.waOpenBtnText}>Open WhatsApp Group</Text>
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
                  <Text style={styles.waCreateBtnText}>Create WhatsApp Group</Text>
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
                <LinearGradient
                  colors={Gradients.teal as unknown as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtnInner}
                >
                  {saveWaLinkMutation.isPending
                    ? <ActivityIndicator color={Colors.white} />
                    : <Text style={styles.saveBtnText}>Save Link</Text>
                  }
                </LinearGradient>
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
                <LinearGradient
                  colors={Gradients.teal as unknown as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtnInner}
                >
                  {setPasswordMutation.isPending
                    ? <ActivityIndicator color={Colors.white} />
                    : <Text style={styles.saveBtnText}>Save Password</Text>
                  }
                </LinearGradient>
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
                  style={[styles.waShareBtn, { marginBottom: Space.sm }]}
                  onPress={() => Linking.openURL(`https://wa.me/?text=${encodeURIComponent(`You're invited to FamilyCart! Set your password here: ${inviteUrl}`)}`)}
                >
                  <Text style={styles.waShareBtnText}>Share via WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.blueShareBtn, { marginBottom: Space.sm }]}
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
                    <LinearGradient
                      colors={Gradients.teal as unknown as [string, string, ...string[]]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.saveBtnInner}
                    >
                      {inviteMutation.isPending
                        ? <ActivityIndicator color={Colors.white} />
                        : <Text style={styles.saveBtnText}>Create invite</Text>
                      }
                    </LinearGradient>
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
  addBtn:            { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full, paddingHorizontal: Space.lg, paddingVertical: 8 },
  addBtnText:        { fontSize: FontSize.sm, color: Colors.white, fontWeight: FontWeight.semi },
  content:           { padding: Space.lg, paddingBottom: 100 },
  memberCard:        { marginBottom: Space.md },
  memberCardContent: { padding: Space.lg },
  avatar:            { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: Space.lg, left: Space.lg },
  avatarText:        { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  memberInfo:        { marginLeft: 56, flex: 1, paddingRight: Space.lg },
  memberNameRow:     { flexDirection: 'row', alignItems: 'center', gap: Space.xs },
  memberName:        { fontSize: FontSize.md, fontWeight: FontWeight.semi, color: Colors.textPrimary },
  youBadge:          { fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: FontWeight.medium },
  memberPhone:       { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 3 },
  memberRight:       { position: 'absolute', top: Space.lg, right: Space.lg, alignItems: 'flex-end', gap: Space.xs },
  roleBadge:         { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  roleBadgeAdmin:    { backgroundColor: Colors.tealLight },
  roleBadgeMember:   { backgroundColor: Colors.blueLight },
  roleBadgeText:     { fontSize: FontSize.xs, fontWeight: FontWeight.semi },
  roleBadgeTextAdmin:{ color: Colors.teal },
  roleBadgeTextMember:{ color: Colors.blue },
  pendingBadge:      { backgroundColor: Colors.warningLight, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  pendingText:       { fontSize: FontSize.xs, color: Colors.amber, fontWeight: FontWeight.semi },
  memberActions:     { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm, marginTop: Space.md, marginLeft: 56, paddingTop: Space.md, borderTopWidth: 1, borderTopColor: Colors.border },
  actionBtn:         { backgroundColor: Colors.blueLight, borderRadius: Radius.full, paddingHorizontal: Space.md, paddingVertical: 6 },
  actionBtnText:     { fontSize: FontSize.xs, color: Colors.blue, fontWeight: FontWeight.semi },
  resendBtn:         { backgroundColor: '#25D366', borderRadius: Radius.full, paddingHorizontal: Space.md, paddingVertical: 6 },
  resendBtnText:     { fontSize: FontSize.xs, color: Colors.white, fontWeight: FontWeight.semi },
  removeBtn:         { backgroundColor: Colors.dangerLight, borderRadius: Radius.full, paddingHorizontal: Space.md, paddingVertical: 6 },
  removeBtnText:     { fontSize: FontSize.xs, color: Colors.danger, fontWeight: FontWeight.semi },
  modalBg:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:             { backgroundColor: Colors.bgCard, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Space.xl, paddingBottom: 40 },
  sheetHandle:       { width: 40, height: 5, borderRadius: 3, backgroundColor: Colors.bgSecondary, alignSelf: 'center', marginBottom: Space.xl },
  sheetTitle:        { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Space.lg },
  infoBox:           { backgroundColor: Colors.tealLight, borderRadius: Radius.sm, padding: Space.lg, marginBottom: Space.xl },
  infoText:          { fontSize: FontSize.sm, color: Colors.tealDark, lineHeight: 22 },
  label:             { fontSize: FontSize.xs, fontWeight: FontWeight.semi, color: Colors.textSecondary, marginBottom: Space.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:             { backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Space.lg, paddingVertical: 14, fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Space.md },
  roleRow:           { flexDirection: 'row', gap: Space.md, marginBottom: Space.xl },
  rolePill:          { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Space.lg },
  rolePillActive:    { borderColor: Colors.teal, backgroundColor: Colors.tealLight },
  rolePillName:      { fontSize: FontSize.sm, fontWeight: FontWeight.semi, color: Colors.textPrimary },
  rolePillNameActive:{ color: Colors.tealDark },
  rolePillSub:       { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 3 },
  sheetBtns:         { flexDirection: 'row', gap: Space.md },
  cancelBtn:         { flex: 1, borderWidth: 1.5, borderColor: Colors.borderMid, borderRadius: Radius.sm, paddingVertical: 15, alignItems: 'center' },
  cancelBtnText:     { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  saveBtn:           { flex: 1, borderRadius: Radius.sm, overflow: 'hidden' },
  saveBtnInner:      { paddingVertical: 15, alignItems: 'center', borderRadius: Radius.sm },
  saveBtnText:       { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.semi },
  btnDisabled:       { opacity: 0.45 },
  sentCircle:        { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.blueLight, alignItems: 'center', justifyContent: 'center', marginBottom: Space.lg },
  sentTitle:         { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Space.xs },
  sentBody:          { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Space.xl },

  waSection:         { marginTop: Space.xl },
  waSectionContent:  { padding: Space.xl },
  waSectionTitle:    { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Space.sm },
  waDescription:     { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22, marginBottom: Space.lg },
  waCreateBtn:       { backgroundColor: '#25D366', borderRadius: Radius.sm, paddingVertical: 15, alignItems: 'center' },
  waCreateBtnText:   { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.semi },
  waOpenBtn:         { backgroundColor: '#25D366', borderRadius: Radius.sm, paddingVertical: 15, alignItems: 'center' },
  waOpenBtnText:     { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.semi },
  waLinkExistingBtn: { marginTop: Space.md, alignItems: 'center', paddingVertical: Space.sm },
  waLinkExistingText:{ fontSize: FontSize.sm, color: Colors.teal, fontWeight: FontWeight.semi },
  waActions:         { flexDirection: 'row', justifyContent: 'center', gap: Space.lg, marginTop: Space.md },
  waChangeLinkBtn:   { paddingVertical: Space.xs, paddingHorizontal: Space.md },
  waChangeLinkText:  { fontSize: FontSize.xs, color: Colors.blue, fontWeight: FontWeight.semi },
  waRemoveLinkBtn:   { paddingVertical: Space.xs, paddingHorizontal: Space.md },
  waRemoveLinkText:  { fontSize: FontSize.xs, color: Colors.danger, fontWeight: FontWeight.semi },
  waShareBtn:        { backgroundColor: '#25D366', borderRadius: Radius.sm, paddingVertical: 15, alignItems: 'center', width: '100%' },
  waShareBtnText:    { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.semi },
  blueShareBtn:      { backgroundColor: Colors.blue, borderRadius: Radius.sm, paddingVertical: 15, alignItems: 'center', width: '100%' },
})