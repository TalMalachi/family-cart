import React, { useState, useCallback, useMemo } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, RefreshControl, TextInput, Modal, Alert, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { api }               from '../../services/api'
import { PermissionGate }    from '../../components/common/PermissionGate'
import type { ShoppingList, ShoppingItem } from '@familycart/shared'
import { Colors, FontSize, FontWeight, Radius, Space, Shadow } from '../../utils/theme'

// ── Single item row ───────────────────────────────────────────────────────────

function ItemRow({
  item,
  onToggle,
  onPress,
}: {
  item: ShoppingItem
  onToggle: () => void
  onPress: () => void
}) {
  const primaryImg = item.images?.find(i => i.isPrimary) ?? item.images?.[0]
  const hasAlt     = item.alternatives?.length > 0

  return (
    <View style={styles.itemRow}>
      {/* Check circle */}
      <PermissionGate require="lists.write">
        <TouchableOpacity style={[styles.circle, item.isPurchased && styles.circleDone]} onPress={onToggle}>
          {item.isPurchased && <Text style={styles.checkMark}>✓</Text>}
        </TouchableOpacity>
      </PermissionGate>
      {/* Without write perm: static indicator */}
      <PermissionGate require="lists.write" fallback={
        <View style={[styles.circle, item.isPurchased && styles.circleDone, { opacity: 0.5 }]}>
          {item.isPurchased && <Text style={styles.checkMark}>✓</Text>}
        </View>
      }>
        {null}
      </PermissionGate>

      {/* Info */}
      <TouchableOpacity style={styles.itemInfo} onPress={onPress} activeOpacity={0.7}>
        <Text style={[styles.itemName, item.isPurchased && styles.itemNameDone]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={styles.metaText}>
            {item.quantity}{item.unit ? ` ${item.unit}` : ''}
            {item.estimatedPrice ? ` · ₪${item.estimatedPrice}` : ''}
          </Text>
          {hasAlt && <View style={styles.altBadge}><Text style={styles.altBadgeText}>alt</Text></View>}
        </View>
      </TouchableOpacity>

      {/* Product image thumbnail */}
      <TouchableOpacity onPress={onPress}>
        {primaryImg
          ? <Image source={{ uri: primaryImg.url }} style={styles.itemThumb} />
          : <View style={[styles.itemThumb, styles.itemThumbEmpty]}>
              <Text style={{ fontSize: 16 }}>📷</Text>
            </View>
        }
      </TouchableOpacity>
    </View>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ListDetailScreen() {
  const { id }        = useLocalSearchParams<{ id: string }>()
  const router        = useRouter()
  const qc            = useQueryClient()
  const [addName, setAddName]   = useState('')
  const [addQty,  setAddQty]    = useState('1')
  const [showAdd, setShowAdd]   = useState(false)

  const { data: list, isLoading, refetch, isRefetching } = useQuery<ShoppingList>({
    queryKey: ['list', id],
    queryFn:  () => api.get(`/lists/${id}`).then(r => r.data),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ itemId, current }: { itemId: string; current: boolean }) =>
      api.patch(`/lists/items/${itemId}`, { isPurchased: !current }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['list', id] }),
  })

  const addMutation = useMutation({
    mutationFn: () => api.post(`/lists/${id}/items`, {
      listId: id, name: addName, quantity: parseFloat(addQty) || 1,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['list', id] })
      setAddName(''); setAddQty('1'); setShowAdd(false)
    },
  })

  const grouped = useMemo(() => {
    if (!list?.items) return []
    const map = new Map<string, ShoppingItem[]>()
    for (const item of list.items) {
      const cat = item.category ?? 'Other'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(item)
    }
    return [...map.entries()]
  }, [list?.items])

  const total     = list?.items?.length ?? 0
  const purchased = list?.items?.filter(i => i.isPurchased).length ?? 0
  const pct       = total > 0 ? (purchased / total) * 100 : 0

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={Colors.teal} size="large" /></View>
  if (!list)     return null

  const flatData: any[] = []
  for (const [cat, items] of grouped) {
    flatData.push({ type: 'section', title: cat, key: `sec-${cat}` })
    for (const item of items) flatData.push({ type: 'item', data: item, key: item.id })
  }

  return (
    <View style={styles.container}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.navBack}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{list.name}</Text>
        <Text style={styles.navProgress}>{purchased}/{total}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progBg}>
        <View style={[styles.progFill, { width: `${pct}%` as any }]} />
      </View>

      <FlatList
        data={flatData}
        keyExtractor={i => i.key}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.teal} />}
        renderItem={({ item }) => {
          if (item.type === 'section') {
            return <Text style={styles.sectionLabel}>{item.title}</Text>
          }
          return (
            <ItemRow
              item={item.data}
              onToggle={() => toggleMutation.mutate({ itemId: item.data.id, current: item.data.isPurchased })}
              onPress={() => router.push(`/(tabs)/lists/item/${item.data.id}`)}
            />
          )
        }}
        ListFooterComponent={
          <PermissionGate require="lists.write">
            <TouchableOpacity style={styles.addRow} onPress={() => setShowAdd(true)}>
              <View style={styles.addPlus}><Text style={styles.addPlusText}>+</Text></View>
              <Text style={styles.addRowText}>Add item…</Text>
            </TouchableOpacity>
          </PermissionGate>
        }
      />

      {/* Add item modal */}
      <Modal visible={showAdd} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalBg}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add item</Text>
            <Text style={styles.label}>Item name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Whole milk"
              placeholderTextColor={Colors.textTertiary}
              value={addName}
              onChangeText={setAddName}
              autoFocus
            />
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              placeholderTextColor={Colors.textTertiary}
              value={addQty}
              onChangeText={setAddQty}
              keyboardType="numeric"
            />
            <View style={styles.sheetBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !addName && styles.btnDisabled]}
                disabled={!addName || addMutation.isPending}
                onPress={() => addMutation.mutate()}
              >
                {addMutation.isPending
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.saveBtnText}>Add item</Text>
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
  container:       { flex: 1, backgroundColor: Colors.bg },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navBar:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.lg, paddingTop: 56, paddingBottom: Space.md, backgroundColor: Colors.teal, gap: Space.sm },
  navBack:         { fontSize: FontSize.xl, color: Colors.white, marginRight: Space.xs },
  navTitle:        { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.medium, color: Colors.white },
  navProgress:     { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)' },
  progBg:          { height: 3, backgroundColor: 'rgba(0,0,0,0.08)' },
  progFill:        { height: '100%', backgroundColor: Colors.white },
  content:         { padding: Space.lg, paddingBottom: 80 },
  sectionLabel:    { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Space.md, marginBottom: Space.xs },
  itemRow:         { flexDirection: 'row', alignItems: 'center', gap: Space.sm, backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: Space.md, marginBottom: 6, borderWidth: 0.5, borderColor: Colors.border },
  circle:          { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: Colors.borderMid, alignItems: 'center', justifyContent: 'center' },
  circleDone:      { backgroundColor: Colors.teal, borderColor: Colors.teal },
  checkMark:       { color: Colors.white, fontSize: 13, fontWeight: FontWeight.semi },
  itemInfo:        { flex: 1 },
  itemName:        { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  itemNameDone:    { color: Colors.textTertiary, textDecorationLine: 'line-through' },
  itemMeta:        { flexDirection: 'row', alignItems: 'center', gap: Space.xs, marginTop: 2 },
  metaText:        { fontSize: FontSize.xs, color: Colors.textSecondary },
  altBadge:        { backgroundColor: Colors.tealLight, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  altBadgeText:    { fontSize: 10, color: Colors.tealDark, fontWeight: FontWeight.medium },
  itemThumb:       { width: 40, height: 40, borderRadius: Radius.sm, overflow: 'hidden' },
  itemThumbEmpty:  { backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: Colors.border },
  addRow:          { flexDirection: 'row', alignItems: 'center', gap: Space.sm, padding: Space.md, borderRadius: Radius.md, borderWidth: 0.5, borderColor: Colors.borderMid, borderStyle: 'dashed', marginTop: Space.sm },
  addPlus:         { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  addPlusText:     { color: Colors.textSecondary, fontSize: 18, lineHeight: 22 },
  addRowText:      { fontSize: FontSize.sm, color: Colors.textSecondary },
  modalBg:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:           { backgroundColor: Colors.bgCard, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Space.xl, paddingBottom: 40 },
  sheetHandle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Space.lg },
  sheetTitle:      { fontSize: FontSize.lg, fontWeight: FontWeight.medium, color: Colors.textPrimary, marginBottom: Space.lg },
  label:           { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: Space.xs, textTransform: 'uppercase', letterSpacing: 0.4 },
  input:           { backgroundColor: Colors.bgSecondary, borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Space.md, paddingVertical: 11, fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Space.md },
  sheetBtns:       { flexDirection: 'row', gap: Space.sm, marginTop: Space.sm },
  cancelBtn:       { flex: 1, borderWidth: 0.5, borderColor: Colors.borderMid, borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center' },
  cancelBtnText:   { fontSize: FontSize.md, color: Colors.textSecondary },
  saveBtn:         { flex: 1, backgroundColor: Colors.teal, borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center' },
  saveBtnText:     { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.medium },
  btnDisabled:     { opacity: 0.45 },
})
