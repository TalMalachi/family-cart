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
import StitchCard from '../../components/common/StitchCard'
import GradientHeader from '../../components/common/GradientHeader'
import { Colors, FontSize, FontWeight, Radius, Space, Shadow, Gradients } from '../../utils/theme'

function ListCard({ list, onPress }: { list: ShoppingList; onPress: () => void }) {
  const total      = list.items?.length ?? 0
  const purchased  = list.items?.filter(i => i.isPurchased).length ?? 0
  const pct        = total > 0 ? purchased / total : 0
  const isComplete = list.status === 'completed'

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <StitchCard style={styles.card} contentStyle={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusDot, { backgroundColor: isComplete ? Colors.teal : Colors.amber }]} />
          <Text style={styles.listName} numberOfLines={1}>{list.name}</Text>
          <View style={styles.itemCountBadge}>
            <Text style={styles.itemCount}>{total}</Text>
          </View>
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
      </StitchCard>
    </TouchableOpacity>
  )
}

export default function ShoppingListsScreen() {
  const router = useRouter()

  const { data: paged, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['lists'],
    queryFn:  () => api.get('/lists?status=all').then(r => r.data),
  })
  const lists = paged?.data ?? []
  const active   = lists.filter(l => l.status === 'active')
  const archived = lists.filter(l => l.status !== 'active')

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.teal} size="large" /></View>
  }

  return (
    <View style={styles.container}>
      <GradientHeader title="Shopping lists">
        <PermissionGate require="lists.create">
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/lists/new')}
          >
            <Text style={styles.addBtnText}>+ New list</Text>
          </TouchableOpacity>
        </PermissionGate>
      </GradientHeader>

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
  addBtn:        { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full, paddingHorizontal: Space.lg, paddingVertical: 8, backdropFilter: 'blur(10)' as any },
  addBtnText:    { fontSize: FontSize.sm, color: Colors.white, fontWeight: FontWeight.semi },
  listContent:   { padding: Space.lg, paddingBottom: 100 },
  sectionLabel:  { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: Space.xl, marginBottom: Space.md },
  card:          { marginBottom: Space.md },
  cardContent:   { padding: Space.lg },
  cardHeader:    { flexDirection: 'row', alignItems: 'center', gap: Space.sm, marginBottom: Space.md },
  statusDot:     { width: 10, height: 10, borderRadius: 5 },
  listName:      { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.semi, color: Colors.textPrimary },
  itemCountBadge:{ backgroundColor: Colors.tealLight, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 2 },
  itemCount:     { fontSize: FontSize.xs, color: Colors.teal, fontWeight: FontWeight.bold },
  progressBg:    { height: 6, backgroundColor: Colors.bgSecondary, borderRadius: 3, marginBottom: Space.md, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: Colors.teal, borderRadius: 3 },
  cardFooter:    { flexDirection: 'row', justifyContent: 'space-between' },
  footerText:    { fontSize: FontSize.xs, color: Colors.textSecondary },
  footerDate:    { fontSize: FontSize.xs, color: Colors.textTertiary },
  emptyCard:     { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, padding: Space.xl, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyText:     { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Space.sm },
  emptyLink:     { fontSize: FontSize.sm, color: Colors.teal, fontWeight: FontWeight.semi },
})