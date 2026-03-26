import React, { useState, useMemo } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, RefreshControl, TextInput, Modal, Alert, ActivityIndicator,
  ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api }               from '../../services/api'
import { PermissionGate }    from '../../components/common/PermissionGate'
import { shareListToWhatsApp } from '../../utils/whatsapp'
import StitchCard from '../../components/common/StitchCard'
import type { ShoppingList, ShoppingItem } from '@familycart/shared'
import { Colors, FontSize, FontWeight, Radius, Space, Shadow, Gradients } from '../../utils/theme'

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
    <StitchCard style={styles.itemRow} contentStyle={styles.itemRowContent}>
      <PermissionGate require="lists.write">
        <TouchableOpacity style={[styles.circle, item.isPurchased && styles.circleDone]} onPress={onToggle}>
          {item.isPurchased && <Text style={styles.checkMark}>✓</Text>}
        </TouchableOpacity>
      </PermissionGate>
      <PermissionGate require="lists.write" fallback={
        <View style={[styles.circle, item.isPurchased && styles.circleDone, { opacity: 0.5 }]}>
          {item.isPurchased && <Text style={styles.checkMark}>✓</Text>}
        </View>
      }>
        {null}
      </PermissionGate>

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

      <TouchableOpacity onPress={onPress}>
        {primaryImg
          ? <Image source={{ uri: primaryImg.url }} style={styles.itemThumb} />
          : <View style={[styles.itemThumb, styles.itemThumbEmpty]}>
              <Text style={{ fontSize: 16 }}>📷</Text>
            </View>
        }
      </TouchableOpacity>
    </StitchCard>
  )
}

const CATEGORIES = [
  { key: 'Produce',       icon: '🥬', he: 'ירקות ופירות' },
  { key: 'Dairy',         icon: '🧀', he: 'מוצרי חלב' },
  { key: 'Meat',          icon: '🍖', he: 'בשר ועוף' },
  { key: 'Bakery',        icon: '🍞', he: 'מאפים' },
  { key: 'Frozen',        icon: '❄️', he: 'קפואים' },
  { key: 'Beverages',     icon: '🥤', he: 'משקאות' },
  { key: 'Snacks',        icon: '🍯', he: 'חטיפים' },
  { key: 'Cleaning',      icon: '🧹', he: 'ניקיון' },
  { key: 'Personal Care', icon: '🪥', he: 'טיפוח' },
  { key: 'Baby',          icon: '👶', he: 'תינוקות' },
  { key: 'Pharmacy',      icon: '💊', he: 'בית מרקחת' },
  { key: 'Other',         icon: '📦', he: 'אחר' },
] as const

const CATEGORY_ORDER = Object.fromEntries(CATEGORIES.map((c, i) => [c.key, i]))

export default function ListDetailScreen() {
  const { id }        = useLocalSearchParams<{ id: string }>()
  const router        = useRouter()
  const qc            = useQueryClient()
  const [addName, setAddName]   = useState('')
  const [addQty,  setAddQty]    = useState('1')
  const [addCat,  setAddCat]    = useState('')
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
      name: addName, quantity: parseFloat(addQty) || 1,
      category: addCat || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['list', id] })
      setAddName(''); setAddQty('1'); setAddCat(''); setShowAdd(false)
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
    return [...map.entries()].sort((a, b) => {
      const oa = CATEGORY_ORDER[a[0]] ?? 900
      const ob = CATEGORY_ORDER[b[0]] ?? 900
      if (oa !== ob) return oa - ob
      return a[0].localeCompare(b[0])
    })
  }, [list?.items])

  const total     = list?.items?.length ?? 0
  const purchased = list?.items?.filter(i => i.isPurchased).length ?? 0
  const pct       = total > 0 ? (purchased / total) * 100 : 0

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={Colors.teal} size="large" /></View>
  if (!list)     return null

  const flatData: any[] = []
  for (const [cat, items] of grouped) {
    const catDef = CATEGORIES.find(c => c.key === cat)
    const icon = catDef?.icon ?? '📋'
    const label = catDef?.he ?? cat
    flatData.push({ type: 'section', title: `${icon} ${label}`, key: `sec-${cat}` })
    for (const item of items) flatData.push({ type: 'item', data: item, key: item.id })
  }

  return (
    <View style={styles.container}>
      {/* Nav bar */}
      <LinearGradient
        colors={Gradients.teal as unknown as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.navBar}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.navBackBtn}>
          <Text style={styles.navBack}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{list.name}</Text>
        <TouchableOpacity
          style={styles.waShareBtn}
          onPress={() => shareListToWhatsApp(list)}
        >
          <Text style={styles.waShareBtnText}>📱</Text>
        </TouchableOpacity>
        <View style={styles.navProgressBadge}>
          <Text style={styles.navProgress}>{purchased}/{total}</Text>
        </View>
      </LinearGradient>

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
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catScrollContent}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.catChip, addCat === c.key && styles.catChipSelected]}
                  onPress={() => setAddCat(addCat === c.key ? '' : c.key)}
                >
                  <Text style={styles.catIcon}>{c.icon}</Text>
                  <Text style={[styles.catLabel, addCat === c.key && styles.catLabelSelected]}>{c.he}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.sheetBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAdd(false); setAddCat('') }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !addName && styles.btnDisabled]}
                disabled={!addName || addMutation.isPending}
                onPress={() => addMutation.mutate()}
              >
                <LinearGradient
                  colors={Gradients.teal as unknown as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtnInner}
                >
                  {addMutation.isPending
                    ? <ActivityIndicator color={Colors.white} />
                    : <Text style={styles.saveBtnText}>Add item</Text>
                  }
                </LinearGradient>
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
  navBar:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.xl, paddingTop: 60, paddingBottom: Space.lg, gap: Space.sm },
  navBackBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  navBack:         { fontSize: FontSize.lg, color: Colors.white },
  navTitle:        { flex: 1, fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white },
  navProgressBadge:{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  navProgress:     { fontSize: FontSize.sm, color: Colors.white, fontWeight: FontWeight.semi },
  waShareBtn:      { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  waShareBtnText:  { fontSize: 16 },
  progBg:          { height: 4, backgroundColor: Colors.bgSecondary },
  progFill:        { height: '100%', backgroundColor: Colors.teal },
  content:         { padding: Space.lg, paddingBottom: 100 },
  sectionLabel:    { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: Space.lg, marginBottom: Space.sm },
  itemRow:         { marginBottom: Space.sm },
  itemRowContent:  { flexDirection: 'row', alignItems: 'center', gap: Space.md, padding: Space.lg },
  circle:          { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.borderMid, alignItems: 'center', justifyContent: 'center' },
  circleDone:      { backgroundColor: Colors.teal, borderColor: Colors.teal },
  checkMark:       { color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold },
  itemInfo:        { flex: 1 },
  itemName:        { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: FontWeight.semi },
  itemNameDone:    { color: Colors.textTertiary, textDecorationLine: 'line-through' },
  itemMeta:        { flexDirection: 'row', alignItems: 'center', gap: Space.xs, marginTop: 3 },
  metaText:        { fontSize: FontSize.xs, color: Colors.textSecondary },
  altBadge:        { backgroundColor: Colors.tealLight, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  altBadgeText:    { fontSize: 10, color: Colors.teal, fontWeight: FontWeight.semi },
  itemThumb:       { width: 44, height: 44, borderRadius: Radius.sm, overflow: 'hidden' },
  itemThumbEmpty:  { backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  addRow:          { flexDirection: 'row', alignItems: 'center', gap: Space.md, padding: Space.lg, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.borderMid, borderStyle: 'dashed', marginTop: Space.md },
  addPlus:         { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.tealLight, alignItems: 'center', justifyContent: 'center' },
  addPlusText:     { color: Colors.teal, fontSize: 18, lineHeight: 22, fontWeight: FontWeight.semi },
  addRowText:      { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  modalBg:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:           { backgroundColor: Colors.bgCard, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Space.xl, paddingBottom: 40 },
  sheetHandle:     { width: 40, height: 5, borderRadius: 3, backgroundColor: Colors.bgSecondary, alignSelf: 'center', marginBottom: Space.xl },
  sheetTitle:      { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Space.xl },
  label:           { fontSize: FontSize.xs, fontWeight: FontWeight.semi, color: Colors.textSecondary, marginBottom: Space.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:           { backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Space.lg, paddingVertical: 14, fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Space.md },
  sheetBtns:       { flexDirection: 'row', gap: Space.md, marginTop: Space.sm },
  cancelBtn:       { flex: 1, borderWidth: 1.5, borderColor: Colors.borderMid, borderRadius: Radius.sm, paddingVertical: 15, alignItems: 'center' },
  cancelBtnText:   { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  saveBtn:         { flex: 1, borderRadius: Radius.sm, overflow: 'hidden' },
  saveBtnInner:    { paddingVertical: 15, alignItems: 'center', borderRadius: Radius.sm },
  saveBtnText:     { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.semi },
  btnDisabled:     { opacity: 0.45 },
  catScroll:         { marginBottom: Space.lg, maxHeight: 72 },
  catScrollContent:  { gap: 8, paddingRight: Space.md },
  catChip:           { alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: Radius.sm, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bgSecondary, minWidth: 68 },
  catChipSelected:   { borderColor: Colors.teal, backgroundColor: Colors.tealLight },
  catIcon:           { fontSize: 22, marginBottom: 3 },
  catLabel:          { fontSize: 10, fontWeight: FontWeight.semi, color: Colors.textSecondary },
  catLabelSelected:  { color: Colors.tealDark },
})