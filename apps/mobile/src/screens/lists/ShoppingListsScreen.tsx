import React, { useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native'
import { useRouter }        from 'expo-router'
import { useQuery }         from '@tanstack/react-query'
import { api }              from '../../services/api'
import { PermissionGate }   from '../../components/common/PermissionGate'
import type { ShoppingList } from '@familycart/shared'
import { Colors, FontSize, FontWeight, Radius, Space, Shadow } from '../../utils/theme'

function ListCard({ list, onPress }: { list: ShoppingList; onPress: () => void }) {
  const total      = list.items?.length ?? 0
  const purchased  = list.items?.filter(i => i.isPurchased).length ?? 0
  const pct        = total > 0 ? purchased / total : 0
  const isComplete = list.status === 'completed'

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusDot, { backgroundColor: isComplete ? Colors.teal : Colors.warning }]} />
        <Text style={styles.listName} numberOfLines={1}>{list.name}</Text>
        <Text style={styles.itemCount}>{total} items</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` as any }]} />
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>
          {purchased}/{total} purchased
        </Text>
        <Text style={styles.footerDate}>
          {new Date(list.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

export default function ShoppingListsScreen() {
  const router = useRouter()

  const { data: lists, isLoading, refetch, isRefetching } = useQuery<ShoppingList[]>({
    queryKey: ['lists'],
    queryFn:  () => api.get('/lists').then(r => r.data),
  })

  const active   = lists?.filter(l => l.status === 'active')    ?? []
  const archived = lists?.filter(l => l.status !== 'active')    ?? []

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.teal} size="large" /></View>
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping lists</Text>
        <PermissionGate require="lists.create">
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/lists/new')}
          >
            <Text style={styles.addBtnText}>+ New list</Text>
          </TouchableOpacity>
        </PermissionGate>
      </View>

      <FlatList
        data={[
          { type: 'section', title: 'Active', key: 'active-head' },
          ...active.map(l => ({ type: 'list', data: l, key: l.id })),
          ...(active.length === 0
            ? [{ type: 'empty', message: 'No active lists', key: 'empty-active' }]
            : []),
          ...(archived.length > 0
            ? [{ type: 'section', title: 'Completed', key: 'archived-head' }]
            : []),
          ...archived.map(l => ({ type: 'list', data: l, key: l.id })),
        ]}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.teal} />
        }
        renderItem={({ item }: any) => {
          if (item.type === 'section') {
            return <Text style={styles.sectionLabel}>{item.title}</Text>
          }
          if (item.type === 'empty') {
            return (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>{item.message}</Text>
                <PermissionGate require="lists.create">
                  <TouchableOpacity onPress={() => router.push('/(tabs)/lists/new')}>
                    <Text style={styles.emptyLink}>Create your first list →</Text>
                  </TouchableOpacity>
                </PermissionGate>
              </View>
            )
          }
          return (
            <ListCard
              list={item.data}
              onPress={() => router.push(`/(tabs)/lists/${item.data.id}`)}
            />
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.bg },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Space.lg, paddingTop: 56, paddingBottom: Space.md, backgroundColor: Colors.teal },
  headerTitle:   { fontSize: FontSize.lg, fontWeight: FontWeight.semi, color: Colors.white },
  addBtn:        { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full, paddingHorizontal: Space.md, paddingVertical: 6 },
  addBtnText:    { fontSize: FontSize.sm, color: Colors.white, fontWeight: FontWeight.medium },
  listContent:   { padding: Space.lg, paddingBottom: 80 },
  sectionLabel:  { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Space.lg, marginBottom: Space.sm },
  card:          { backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: Space.lg, marginBottom: Space.sm, borderWidth: 0.5, borderColor: Colors.border, ...Shadow.card },
  cardHeader:    { flexDirection: 'row', alignItems: 'center', gap: Space.sm, marginBottom: Space.sm },
  statusDot:     { width: 8, height: 8, borderRadius: 4 },
  listName:      { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  itemCount:     { fontSize: FontSize.sm, color: Colors.textSecondary },
  progressBg:    { height: 4, backgroundColor: Colors.bgSecondary, borderRadius: 2, marginBottom: Space.sm, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: Colors.teal, borderRadius: 2 },
  cardFooter:    { flexDirection: 'row', justifyContent: 'space-between' },
  footerText:    { fontSize: FontSize.xs, color: Colors.textSecondary },
  footerDate:    { fontSize: FontSize.xs, color: Colors.textTertiary },
  emptyCard:     { backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: Space.xl, alignItems: 'center', borderWidth: 0.5, borderColor: Colors.border, borderStyle: 'dashed' },
  emptyText:     { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Space.sm },
  emptyLink:     { fontSize: FontSize.sm, color: Colors.teal, fontWeight: FontWeight.medium },
})
