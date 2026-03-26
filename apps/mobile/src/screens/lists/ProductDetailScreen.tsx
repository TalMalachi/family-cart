import React, { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, Switch,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api }                 from '../../services/api'
import { useImageUpload }      from '../../hooks/useImageUpload'
import { ImageGallery }        from '../../components/common/ImageGallery'
import { AlternativesManager } from '../../components/lists/AlternativesManager'
import { PermissionGate }      from '../../components/common/PermissionGate'
import StitchCard              from '../../components/common/StitchCard'
import type { ShoppingItem }   from '@familycart/shared'
import { Colors, FontSize, FontWeight, Radius, Space, Shadow, Gradients } from '../../utils/theme'

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <StitchCard style={{ marginHorizontal: Space.lg }} contentStyle={{ overflow: 'hidden' }}>{children}</StitchCard>
    </View>
  )
}

function FieldRow({
  label, value, placeholder, onChangeText,
  keyboardType = 'default', editable = true,
}: {
  label: string; value: string; placeholder?: string
  onChangeText: (t: string) => void
  keyboardType?: 'default' | 'numeric' | 'decimal-pad'
  editable?: boolean
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, !editable && styles.fieldInputDisabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? '—'}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboardType}
        editable={editable}
      />
    </View>
  )
}

export default function ProductDetailScreen() {
  const { itemId, listId } = useLocalSearchParams<{ itemId: string; listId: string }>()
  const router             = useRouter()
  const qc                 = useQueryClient()

  const { data: item, isLoading } = useQuery<ShoppingItem>({
    queryKey: ['item', itemId],
    queryFn:  () => api.get(`/lists/items/${itemId}`).then(r => r.data),
  })

  const [name,     setName]     = useState('')
  const [qty,      setQty]      = useState('')
  const [unit,     setUnit]     = useState('')
  const [price,    setPrice]    = useState('')
  const [category, setCategory] = useState('')
  const [isDirty,  setIsDirty]  = useState(false)
  const [selectedImg, setSelectedImg] = useState<string | null>(null)

  React.useEffect(() => {
    if (item && !isDirty) {
      setName(item.name)
      setQty(String(item.quantity))
      setUnit(item.unit ?? '')
      setPrice(item.estimatedPrice ? String(item.estimatedPrice) : '')
      setCategory(item.category ?? '')
      const primary = item.images?.find(i => i.isPrimary) ?? item.images?.[0]
      if (primary) setSelectedImg(primary.id)
    }
  }, [item])

  const markDirty = useCallback(
    (setter: (v: string) => void) => (v: string) => { setter(v); setIsDirty(true) },
    []
  )

  const saveMutation = useMutation({
    mutationFn: () => api.patch(`/lists/items/${itemId}`, {
      name,
      quantity:       parseFloat(qty) || 1,
      unit:           unit    || undefined,
      estimatedPrice: price   ? parseFloat(price) : undefined,
      category:       category || undefined,
    }),
    onSuccess: () => {
      setIsDirty(false)
      qc.invalidateQueries({ queryKey: ['item', itemId] })
      qc.invalidateQueries({ queryKey: ['list', listId] })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: () => api.patch(`/lists/items/${itemId}`, { isPurchased: !item?.isPurchased }),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['item', itemId] })
      qc.invalidateQueries({ queryKey: ['list', listId] })
    },
  })

  const { state: uploadState, progress, error: uploadError, pickAndUpload } = useImageUpload({
    itemId: itemId ?? '',
    onSuccess: (imageId: string) => {
      qc.invalidateQueries({ queryKey: ['item', itemId] })
      setSelectedImg(imageId)
    },
  })

  const setPrimaryMutation = useMutation({
    mutationFn: (imgId: string) => api.patch(`/media/${imgId}/primary`, {}),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['item', itemId] }),
  })

  const deleteImgMutation = useMutation({
    mutationFn: (imgId: string) => api.delete(`/media/${imgId}`),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['item', itemId] })
      setSelectedImg(null)
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: () => api.delete(`/lists/items/${itemId}`),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['list', listId] })
      router.back()
    },
  })

  const [aiSearching, setAiSearching] = useState(false)
  const aiImageSearch = async () => {
    const n = name || item?.name
    if (!n) { Alert.alert('Enter a name', 'Type an item name first.'); return }
    setAiSearching(true)
    try {
      const res = await api.post('/lists/items/ai-image-search', { name: n, category: category || item?.category })
      const url = res.data?.imageUrl
      if (!url) { Alert.alert('No image found', 'Try a more specific product name.'); return }
      await api.post(`/lists/items/${itemId}/images`, { url, isPrimary: true })
      qc.invalidateQueries({ queryKey: ['item', itemId] })
      Alert.alert('Image attached', res.data.title || 'AI image saved as primary.')
    } catch (e: any) {
      Alert.alert('AI search failed', e?.response?.data?.message || e.message || 'Unknown error')
    } finally {
      setAiSearching(false)
    }
  }

  const confirmDeleteImg = (imgId: string) =>
    Alert.alert('Delete photo', 'Remove this product photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteImgMutation.mutate(imgId) },
    ])

  const confirmDeleteItem = () =>
    Alert.alert('Remove item', `Remove "${item?.name}" from the list?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteItemMutation.mutate() },
    ])

  if (isLoading || !item) {
    return <View style={styles.center}><ActivityIndicator color={Colors.teal} size="large" /></View>
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={88}
    >
      {/* Nav bar */}
      <LinearGradient
        colors={Gradients.teal as unknown as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.navBar}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.navBackBtn}>
          <Text style={styles.navBackText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{item.name}</Text>
        {isDirty && (
          <TouchableOpacity
            style={styles.saveNavBtn}
            onPress={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <Text style={styles.saveNavBtnText}>Save</Text>
            }
          </TouchableOpacity>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Purchased toggle */}
        <StitchCard style={{ marginHorizontal: Space.lg, marginTop: Space.lg }} contentStyle={{ flexDirection: 'row', alignItems: 'center', padding: Space.lg }}>
          <View style={styles.purchasedInfo}>
            <Text style={styles.purchasedLabel}>Purchased</Text>
            {item.isPurchased && item.purchasedAt && (
              <Text style={styles.purchasedMeta}>
                marked {new Date(item.purchasedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
          <PermissionGate
            require="lists.write"
            fallback={
              <View style={[styles.purchasedIndicator, item.isPurchased && styles.purchasedIndicatorOn]}>
                <Text style={styles.purchasedIndicatorText}>{item.isPurchased ? 'Yes' : 'No'}</Text>
              </View>
            }
          >
            <Switch
              value={item.isPurchased}
              onValueChange={() => toggleMutation.mutate()}
              trackColor={{ false: Colors.bgSecondary, true: Colors.tealLight }}
              thumbColor={item.isPurchased ? Colors.teal : Colors.textTertiary}
              ios_backgroundColor={Colors.bgSecondary}
            />
          </PermissionGate>
        </StitchCard>

        {/* Product details */}
        <Section title="Product details">
          <PermissionGate
            require="lists.write"
            fallback={
              <View style={styles.readonlyBlock}>
                <Text style={styles.readonlyName}>{item.name}</Text>
                <Text style={styles.readonlyMeta}>
                  {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                  {item.estimatedPrice ? ` · ₪${item.estimatedPrice}` : ''}
                  {item.category ? ` · ${item.category}` : ''}
                </Text>
              </View>
            }
          >
            <FieldRow label="Name"          value={name}     onChangeText={markDirty(setName)}     placeholder="Item name" />
            <FieldRow label="Quantity"       value={qty}      onChangeText={markDirty(setQty)}      keyboardType="decimal-pad" />
            <FieldRow label="Unit"           value={unit}     onChangeText={markDirty(setUnit)}      placeholder="kg, pcs, L…" />
            <FieldRow label="Est. price (₪)" value={price}    onChangeText={markDirty(setPrice)}    keyboardType="decimal-pad" />
            <View style={styles.categoryPickerRow}>
              <Text style={styles.fieldLabel}>Category</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catScrollContent}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.catChip, category === c.key && styles.catChipSelected]}
                  onPress={() => { setCategory(category === c.key ? '' : c.key); setIsDirty(true) }}
                >
                  <Text style={styles.catChipIcon}>{c.icon}</Text>
                  <Text style={[styles.catChipLabel, category === c.key && styles.catChipLabelSelected]}>{c.he}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </PermissionGate>
        </Section>

        {/* Product photos */}
        <Section title="Product photos">
          <ImageGallery
            images={item.images ?? []}
            selectedId={selectedImg}
            uploadState={uploadState}
            uploadProgress={progress}
            uploadError={uploadError ?? ''}
            onSelect={setSelectedImg}
            onSetPrimary={id => setPrimaryMutation.mutate(id)}
            onDelete={confirmDeleteImg}
            onPickCamera={() => pickAndUpload('camera')}
            onPickLibrary={() => pickAndUpload('library')}
          />
          <PermissionGate require="lists.write">
            <TouchableOpacity
              style={styles.aiFindBtn}
              onPress={aiImageSearch}
              disabled={aiSearching}
            >
              {aiSearching
                ? <ActivityIndicator color={Colors.teal} size="small" />
                : <Text style={styles.aiFindBtnText}>Find Image by AI</Text>
              }
            </TouchableOpacity>
          </PermissionGate>
        </Section>

        {/* Alternatives */}
        <Section title="Alternative products">
          <AlternativesManager
            itemId={itemId ?? ''}
            listQueryKey={`list-${listId}`}
            alternatives={item.alternatives ?? []}
          />
        </Section>

        {/* Danger zone */}
        <PermissionGate require="lists.write">
          <View style={styles.dangerZone}>
            <TouchableOpacity
              style={styles.deleteItemBtn}
              onPress={confirmDeleteItem}
              disabled={deleteItemMutation.isPending}
            >
              {deleteItemMutation.isPending
                ? <ActivityIndicator color={Colors.danger} size="small" />
                : <Text style={styles.deleteItemBtnText}>Remove from list</Text>
              }
            </TouchableOpacity>
          </View>
        </PermissionGate>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating save bar */}
      {isDirty && (
        <View style={styles.savebar}>
          <Text style={styles.savebarMsg}>Unsaved changes</Text>
          <TouchableOpacity
            style={styles.savebarBtn}
            onPress={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            <LinearGradient
              colors={Gradients.teal as unknown as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.savebarBtnInner}
            >
              {saveMutation.isPending
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={styles.savebarBtnText}>Save changes</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex:                    { flex: 1, backgroundColor: Colors.bg },
  center:                  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navBar:                  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.xl, paddingTop: 60, paddingBottom: Space.lg, gap: Space.sm },
  navBackBtn:              { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  navBackText:             { fontSize: FontSize.lg, color: Colors.white },
  navTitle:                { flex: 1, fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white },
  saveNavBtn:              { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: Radius.full, paddingHorizontal: Space.lg, paddingVertical: 6 },
  saveNavBtnText:          { fontSize: FontSize.sm, color: Colors.white, fontWeight: FontWeight.semi },
  content:                 { paddingBottom: 100 },
  purchasedInfo:           { flex: 1 },
  purchasedLabel:          { fontSize: FontSize.md, fontWeight: FontWeight.semi, color: Colors.textPrimary },
  purchasedMeta:           { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 3 },
  purchasedIndicator:      { backgroundColor: Colors.bgSecondary, borderRadius: Radius.sm, paddingHorizontal: Space.md, paddingVertical: 4 },
  purchasedIndicatorOn:    { backgroundColor: Colors.tealLight },
  purchasedIndicatorText:  { fontSize: FontSize.sm, color: Colors.textSecondary },
  section:                 { marginTop: Space.xl },
  sectionTitle:            { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: Space.lg, marginBottom: Space.sm },
  fieldRow:                { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.lg, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  fieldLabel:              { width: 110, fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  fieldInput:              { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, paddingVertical: 2 },
  fieldInputDisabled:      { color: Colors.textTertiary },
  readonlyBlock:           { padding: Space.lg },
  readonlyName:            { fontSize: FontSize.md, fontWeight: FontWeight.semi, color: Colors.textPrimary },
  readonlyMeta:            { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Space.xs },
  dangerZone:              { marginHorizontal: Space.lg, marginTop: Space.xl },
  deleteItemBtn:           { borderWidth: 1.5, borderColor: Colors.danger + '44', borderRadius: Radius.sm, paddingVertical: 14, alignItems: 'center' },
  deleteItemBtnText:       { fontSize: FontSize.sm, color: Colors.danger, fontWeight: FontWeight.semi },
  savebar:                 { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: Space.lg, paddingVertical: Space.md, paddingBottom: 28, gap: Space.md, ...Shadow.elevated },
  savebarMsg:              { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  savebarBtn:              { borderRadius: Radius.sm, overflow: 'hidden' },
  savebarBtnInner:         { paddingHorizontal: Space.xl, paddingVertical: 12, borderRadius: Radius.sm },
  savebarBtnText:          { fontSize: FontSize.sm, color: Colors.white, fontWeight: FontWeight.semi },
  aiFindBtn:               { borderTopWidth: 1, borderTopColor: Colors.border, paddingVertical: 14, alignItems: 'center' },
  aiFindBtnText:           { fontSize: FontSize.sm, color: Colors.teal, fontWeight: FontWeight.semi },
  categoryPickerRow:       { paddingHorizontal: Space.lg, paddingTop: 12, paddingBottom: 4 },
  catScroll:               { paddingHorizontal: Space.lg, paddingBottom: 12, maxHeight: 68 },
  catScrollContent:        { gap: 8 },
  catChip:                 { alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: Radius.sm, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bgSecondary, minWidth: 60 },
  catChipSelected:         { borderColor: Colors.teal, backgroundColor: Colors.tealLight },
  catChipIcon:             { fontSize: 20, marginBottom: 2 },
  catChipLabel:            { fontSize: 9, fontWeight: FontWeight.semi, color: Colors.textSecondary },
  catChipLabelSelected:    { color: Colors.tealDark },
} as const)