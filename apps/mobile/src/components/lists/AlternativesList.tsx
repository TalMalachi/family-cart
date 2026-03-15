import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Modal, Image, ActivityIndicator,
} from 'react-native'
import type { AlternativeProduct } from '@familycart/shared'
import { Colors, FontSize, FontWeight, Radius, Space, Shadow } from '../../utils/theme'

const PRIORITY_CONFIG = {
  preferred: { label: 'Preferred', bg: Colors.tealLight,    text: Colors.tealDark,   border: Colors.teal },
  fallback:  { label: 'Fallback',  bg: Colors.warningLight, text: Colors.warning,    border: Colors.warning },
}

interface AlternativeRowProps {
  alt:      AlternativeProduct
  canEdit:  boolean
  onEdit:   () => void
  onDelete: () => void
}

function AlternativeRow({ alt, canEdit, onEdit, onDelete }: AlternativeRowProps) {
  const cfg = PRIORITY_CONFIG[alt.priority]

  return (
    <View style={styles.altRow}>
      {/* Image or placeholder */}
      {alt.image?.url
        ? <Image source={{ uri: alt.image.url }} style={styles.altImg} resizeMode="cover" />
        : (
          <View style={[styles.altImg, styles.altImgEmpty]}>
            <Text style={{ fontSize: 18 }}>🛒</Text>
          </View>
        )
      }

      {/* Info */}
      <View style={styles.altInfo}>
        <View style={styles.altNameRow}>
          <Text style={styles.altName} numberOfLines={1}>{alt.name}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <Text style={[styles.priorityText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
        </View>
        {!!alt.note && <Text style={styles.altNote} numberOfLines={2}>{alt.note}</Text>}
      </View>

      {/* Actions */}
      {canEdit && (
        <View style={styles.altActions}>
          <TouchableOpacity onPress={onEdit} style={styles.altActionBtn}>
            <Text style={styles.altActionEdit}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.altActionBtn}>
            <Text style={styles.altActionDelete}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

interface AddAltSheetProps {
  visible:   boolean
  onClose:   () => void
  onSave:    (data: { name: string; note: string; priority: 'preferred' | 'fallback' }) => Promise<void>
  initial?:  { name: string; note: string; priority: 'preferred' | 'fallback' } | null
}

export function AddAlternativeSheet({ visible, onClose, onSave, initial }: AddAltSheetProps) {
  const [name,     setName]     = useState(initial?.name     ?? '')
  const [note,     setNote]     = useState(initial?.note     ?? '')
  const [priority, setPriority] = useState<'preferred' | 'fallback'>(initial?.priority ?? 'fallback')
  const [saving,   setSaving]   = useState(false)

  React.useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '')
      setNote(initial?.note ?? '')
      setPriority(initial?.priority ?? 'fallback')
    }
  }, [visible, initial])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave({ name: name.trim(), note: note.trim(), priority })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" presentationStyle="overFullScreen" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{initial ? 'Edit alternative' : 'Add alternative product'}</Text>

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
          placeholder="e.g. If Telma brand is not available"
          placeholderTextColor={Colors.textTertiary}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={2}
        />

        <Text style={styles.label}>Priority</Text>
        <View style={styles.priorityRow}>
          {(['preferred', 'fallback'] as const).map(p => {
            const cfg = PRIORITY_CONFIG[p]
            const active = priority === p
            return (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityPill,
                  active && { borderColor: cfg.border, backgroundColor: cfg.bg },
                ]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.priorityPillText, active && { color: cfg.text }]}>
                  {cfg.label}
                </Text>
                <Text style={[styles.priorityPillSub, active && { color: cfg.text, opacity: 0.7 }]}>
                  {p === 'preferred' ? '1st choice if main unavailable' : 'Last resort option'}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.sheetBtns}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, !name.trim() && styles.btnDisabled]}
            disabled={!name.trim() || saving}
            onPress={handleSave}
          >
            {saving
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <Text style={styles.saveBtnText}>Save alternative</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

interface Props {
  alternatives: AlternativeProduct[]
  canEdit:      boolean
  onAdd:        (data: { name: string; note: string; priority: 'preferred' | 'fallback' }) => Promise<void>
  onDelete:     (id: string) => void
}

export function AlternativesList({ alternatives, canEdit, onAdd, onDelete }: Props) {
  const [showAdd,  setShowAdd]  = useState(false)
  const [editing,  setEditing]  = useState<AlternativeProduct | null>(null)

  const sorted = [...alternatives].sort((a, b) =>
    a.priority === 'preferred' ? -1 : b.priority === 'preferred' ? 1 : 0
  )

  return (
    <View>
      {sorted.length === 0 ? (
        <View style={styles.emptyAlt}>
          <Text style={styles.emptyAltText}>No alternatives added yet.</Text>
          {canEdit && (
            <Text style={styles.emptyAltSub}>
              Add a backup product in case this one is out of stock.
            </Text>
          )}
        </View>
      ) : (
        sorted.map((alt, i) => (
          <View key={alt.id}>
            <AlternativeRow
              alt={alt}
              canEdit={canEdit}
              onEdit={() => setEditing(alt)}
              onDelete={() => onDelete(alt.id)}
            />
            {i < sorted.length - 1 && <View style={styles.rowDivider} />}
          </View>
        ))
      )}

      {canEdit && (
        <TouchableOpacity style={styles.addAltBtn} onPress={() => setShowAdd(true)} activeOpacity={0.8}>
          <Text style={styles.addAltPlus}>+</Text>
          <Text style={styles.addAltText}>Add alternative product</Text>
        </TouchableOpacity>
      )}

      <AddAlternativeSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={onAdd}
      />
      <AddAlternativeSheet
        visible={!!editing}
        onClose={() => setEditing(null)}
        onSave={onAdd}
        initial={editing}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  altRow:           { flexDirection: 'row', alignItems: 'center', gap: Space.sm, paddingVertical: Space.sm },
  altImg:           { width: 48, height: 48, borderRadius: Radius.sm, overflow: 'hidden' },
  altImgEmpty:      { backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: Colors.border },
  altInfo:          { flex: 1, minWidth: 0 },
  altNameRow:       { flexDirection: 'row', alignItems: 'center', gap: Space.xs, flexWrap: 'wrap' },
  altName:          { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary, flexShrink: 1 },
  priorityBadge:    { borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 1 },
  priorityText:     { fontSize: 10, fontWeight: FontWeight.medium },
  altNote:          { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  altActions:       { flexDirection: 'row', gap: Space.xs },
  altActionBtn:     { padding: Space.xs },
  altActionEdit:    { fontSize: FontSize.xs, color: Colors.blue, fontWeight: FontWeight.medium },
  altActionDelete:  { fontSize: FontSize.sm, color: Colors.danger },
  rowDivider:       { height: 0.5, backgroundColor: Colors.border },
  emptyAlt:         { paddingVertical: Space.lg, alignItems: 'center' },
  emptyAltText:     { fontSize: FontSize.sm, color: Colors.textSecondary },
  emptyAltSub:      { fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'center', marginTop: Space.xs, lineHeight: 18 },
  addAltBtn:        { flexDirection: 'row', alignItems: 'center', gap: Space.sm, paddingVertical: Space.md, borderTopWidth: 0.5, borderTopColor: Colors.border, marginTop: Space.xs },
  addAltPlus:       { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.bgSecondary, textAlign: 'center', lineHeight: 24, fontSize: 18, color: Colors.textSecondary },
  addAltText:       { fontSize: FontSize.sm, color: Colors.teal, fontWeight: FontWeight.medium },
  // Sheet styles
  backdrop:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:            { backgroundColor: Colors.bgCard, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Space.xl, paddingBottom: 40 },
  sheetHandle:      { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Space.lg },
  sheetTitle:       { fontSize: FontSize.lg, fontWeight: FontWeight.medium, color: Colors.textPrimary, marginBottom: Space.lg },
  label:            { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: Space.xs, textTransform: 'uppercase', letterSpacing: 0.4 },
  input:            { backgroundColor: Colors.bgSecondary, borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Space.md, paddingVertical: 11, fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Space.md },
  inputMulti:       { height: 72, textAlignVertical: 'top', paddingTop: 11 },
  priorityRow:      { flexDirection: 'row', gap: Space.sm, marginBottom: Space.lg },
  priorityPill:     { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Space.md },
  priorityPillText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  priorityPillSub:  { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  sheetBtns:        { flexDirection: 'row', gap: Space.sm },
  cancelBtn:        { flex: 1, borderWidth: 0.5, borderColor: Colors.borderMid, borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center' },
  cancelText:       { fontSize: FontSize.md, color: Colors.textSecondary },
  saveBtn:          { flex: 1, backgroundColor: Colors.teal, borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center' },
  saveBtnText:      { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.medium },
  btnDisabled:      { opacity: 0.45 },
})
