import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Modal, ActivityIndicator, Alert,
} from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api }             from '../../services/api'
import { PermissionGate }  from './PermissionGate'
import type { AlternativeProduct } from '@familycart/shared'
import { Colors, FontSize, FontWeight, Radius, Space, Shadow } from '../../utils/theme'

interface Props {
  itemId:       string
  listQueryKey: string   // to invalidate after mutation
  alternatives: AlternativeProduct[]
}

type Priority = 'preferred' | 'fallback'

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; desc: string }> = {
  preferred: { label: 'Preferred', color: Colors.tealDark, bg: Colors.tealLight,    desc: 'Use this first if the main product is unavailable' },
  fallback:  { label: 'Fallback',  color: Colors.warning,  bg: Colors.warningLight, desc: 'Use only as a last resort' },
}

export function AlternativesManager({ itemId, listQueryKey, alternatives }: Props) {
  const qc = useQueryClient()
  const [showAdd, setShowAdd]   = useState(false)
  const [name,    setName]      = useState('')
  const [note,    setNote]      = useState('')
  const [priority, setPriority] = useState<Priority>('preferred')

  const addMutation = useMutation({
    mutationFn: () => api.post(`/lists/items/${itemId}/alternatives`, { name, note: note || undefined, priority }),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: [listQueryKey] })
      setShowAdd(false)
      setName(''); setNote(''); setPriority('preferred')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (altId: string) => api.delete(`/lists/items/${itemId}/alternatives/${altId}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [listQueryKey] }),
  })

  const confirmDelete = (alt: AlternativeProduct) => {
    Alert.alert(
      'Remove alternative',
      `Remove "${alt.name}" as an alternative?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteMutation.mutate(alt.id) },
      ]
    )
  }

  const sorted = [...alternatives].sort((a, b) =>
    a.priority === 'preferred' && b.priority !== 'preferred' ? -1 : 1
  )

  return (
    <View>
      {/* Existing alternatives */}
      {sorted.length === 0 ? (
        <View style={styles.emptyAlt}>
          <Text style={styles.emptyAltText}>No alternatives yet</Text>
          <Text style={styles.emptyAltSub}>Add a backup product in case this one isn't available</Text>
        </View>
      ) : (
        sorted.map((alt, i) => {
          const cfg = PRIORITY_CONFIG[alt.priority]
          return (
            <View key={alt.id} style={[styles.altRow, i < sorted.length - 1 && styles.altRowBorder]}>
              {/* Priority indicator */}
              <View style={[styles.priorityDot, { backgroundColor: cfg.color }]} />

              {/* Info */}
              <View style={styles.altInfo}>
                <View style={styles.altNameRow}>
                  <Text style={styles.altName}>{alt.name}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.priorityBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
                {alt.note && <Text style={styles.altNote}>{alt.note}</Text>}
              </View>

              {/* Remove action */}
              <PermissionGate require="lists.write">
                <TouchableOpacity
                  style={styles.removeAltBtn}
                  onPress={() => confirmDelete(alt)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.removeAltIcon}>×</Text>
                </TouchableOpacity>
              </PermissionGate>
            </View>
          )
        })
      )}

      {/* Add alternative button */}
      <PermissionGate require="lists.write">
        <TouchableOpacity style={styles.addAltBtn} onPress={() => setShowAdd(true)} activeOpacity={0.8}>
          <Text style={styles.addAltIcon}>+</Text>
          <Text style={styles.addAltText}>Add alternative product</Text>
        </TouchableOpacity>
      </PermissionGate>

      {/* Add modal */}
      <Modal visible={showAdd} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalBg}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add alternative</Text>

            <Text style={styles.label}>Product name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Yad Mordechai organic olive oil"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="e.g. Only if the Telma brand is out of stock"
              placeholderTextColor={Colors.textTertiary}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
            />

            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityRow}>
              {(['preferred', 'fallback'] as Priority[]).map(p => {
                const cfg = PRIORITY_CONFIG[p]
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityPill,
                      priority === p && { borderColor: cfg.color, backgroundColor: cfg.bg },
                    ]}
                    onPress={() => setPriority(p)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.priorityPillName, priority === p && { color: cfg.color }]}>
                      {cfg.label}
                    </Text>
                    <Text style={[styles.priorityPillDesc, priority === p && { color: cfg.color + 'AA' }]}>
                      {cfg.desc}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <View style={styles.sheetBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setShowAdd(false); setName(''); setNote('') }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !name && styles.btnDisabled]}
                disabled={!name || addMutation.isPending}
                onPress={() => addMutation.mutate()}
              >
                {addMutation.isPending
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={styles.saveBtnText}>Add alternative</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  emptyAlt:           { alignItems: 'center', paddingVertical: Space.xl },
  emptyAltText:       { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  emptyAltSub:        { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: Space.xs, textAlign: 'center', lineHeight: 16 },
  altRow:             { flexDirection: 'row', alignItems: 'center', paddingVertical: Space.md, gap: Space.sm },
  altRowBorder:       { borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  priorityDot:        { width: 8, height: 8, borderRadius: 4, marginTop: 2, flexShrink: 0 },
  altInfo:            { flex: 1 },
  altNameRow:         { flexDirection: 'row', alignItems: 'center', gap: Space.xs, flexWrap: 'wrap' },
  altName:            { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary, flexShrink: 1 },
  priorityBadge:      { borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  priorityBadgeText:  { fontSize: 10, fontWeight: FontWeight.medium },
  altNote:            { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  removeAltBtn:       { padding: Space.xs },
  removeAltIcon:      { fontSize: 22, color: Colors.textTertiary, lineHeight: 24 },
  addAltBtn:          { flexDirection: 'row', alignItems: 'center', gap: Space.sm, paddingVertical: Space.md, borderTopWidth: 0.5, borderTopColor: Colors.border, marginTop: Space.xs },
  addAltIcon:         { fontSize: 18, color: Colors.teal, fontWeight: FontWeight.medium, width: 20, textAlign: 'center' },
  addAltText:         { fontSize: FontSize.sm, color: Colors.teal, fontWeight: FontWeight.medium },
  modalBg:            { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:              { backgroundColor: Colors.bgCard, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Space.xl, paddingBottom: 44 },
  sheetHandle:        { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Space.lg },
  sheetTitle:         { fontSize: FontSize.lg, fontWeight: FontWeight.medium, color: Colors.textPrimary, marginBottom: Space.lg },
  label:              { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: Space.xs, textTransform: 'uppercase', letterSpacing: 0.4 },
  input:              { backgroundColor: Colors.bgSecondary, borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Space.md, paddingVertical: 11, fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Space.md },
  inputMulti:         { height: 70, textAlignVertical: 'top' },
  priorityRow:        { flexDirection: 'row', gap: Space.sm, marginBottom: Space.lg },
  priorityPill:       { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Space.md },
  priorityPillName:   { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary, marginBottom: 2 },
  priorityPillDesc:   { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 15 },
  sheetBtns:          { flexDirection: 'row', gap: Space.sm },
  cancelBtn:          { flex: 1, borderWidth: 0.5, borderColor: Colors.borderMid, borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center' },
  cancelBtnText:      { fontSize: FontSize.md, color: Colors.textSecondary },
  saveBtn:            { flex: 1, backgroundColor: Colors.teal, borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center' },
  saveBtnText:        { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.medium },
  btnDisabled:        { opacity: 0.45 },
})
