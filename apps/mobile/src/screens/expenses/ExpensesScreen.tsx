import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator, Modal, TextInput,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api }             from '../../services/api'
import { PermissionGate }  from '../../components/common/PermissionGate'
import type { Expense, ExpenseSummary, ExpenseCategory } from '@familycart/shared'
import { Colors, FontSize, FontWeight, Radius, Space, Shadow, Gradients } from '../../utils/theme'
import StitchCard from '../../components/common/StitchCard'
import GradientHeader from '../../components/common/GradientHeader'

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  groceries:  Colors.teal,
  household:  Colors.blue,
  personal:   Colors.amber,
  pharmacy:   '#E11D48',
  other:      Colors.textTertiary,
}

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  groceries: '🛒', household: '🧹', personal: '🧴', pharmacy: '💊', other: '📦',
}

function SummaryCard({ summary }: { summary: ExpenseSummary }) {
  const cats = Object.entries(summary.byCategory ?? {}) as [ExpenseCategory, number][]
  const total = summary.total || 1

  return (
    <StitchCard style={styles.summaryCard} contentStyle={styles.summaryCardContent} variant="elevated">
      <Text style={styles.summaryMonth}>
        {new Date(summary.month + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
      </Text>
      <Text style={styles.summaryTotal}>₪{summary.total.toLocaleString()}</Text>

      {/* Category bar */}
      <View style={styles.catBar}>
        {cats.map(([cat, amt]) => (
          <View
            key={cat}
            style={[styles.catSeg, { width: `${(amt / total) * 100}%` as any, backgroundColor: CATEGORY_COLORS[cat] }]}
          />
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {cats.map(([cat, amt]) => (
          <View key={cat} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS[cat] }]} />
            <Text style={styles.legendText}>
              {cat} {Math.round((amt / total) * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </StitchCard>
  )
}

function ExpenseRow({ expense, onDelete }: { expense: Expense; onDelete: () => void }) {
  return (
    <StitchCard style={styles.expRow} contentStyle={styles.expRowContent}>
      <View style={[styles.expIcon, { backgroundColor: (CATEGORY_COLORS[expense.category] + '18') }]}>
        <Text style={{ fontSize: 18 }}>{CATEGORY_ICONS[expense.category]}</Text>
      </View>
      <View style={styles.expInfo}>
        <Text style={styles.expTitle}>{expense.title}</Text>
        <Text style={styles.expMeta}>
          {new Date(expense.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          {' · '}paid by {(expense as any).paidByName ?? 'you'}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.expAmount}>₪{expense.totalAmount.toLocaleString()}</Text>
        <PermissionGate require="exp.delete">
          <TouchableOpacity onPress={onDelete}>
            <Text style={styles.deleteLink}>Remove</Text>
          </TouchableOpacity>
        </PermissionGate>
      </View>
    </StitchCard>
  )
}

export default function ExpensesScreen() {
  const qc            = useQueryClient()
  const [month]       = useState(() => new Date().toISOString().slice(0, 7))
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', category: 'groceries' as ExpenseCategory })

  const { data: summary, isLoading: loadSummary, refetch: refetchSummary } =
    useQuery<ExpenseSummary>({ queryKey: ['expenses-summary', month], queryFn: () => api.get(`/expenses/summary?month=${month}`).then(r => r.data) })

  const { data: expenses, isLoading: loadExp, refetch: refetchExp, isRefetching } =
    useQuery<Expense[]>({ queryKey: ['expenses', month], queryFn: () => api.get(`/expenses?month=${month}`).then(r => r.data) })

  const addMutation = useMutation({
    mutationFn: () => api.post('/expenses', {
      title: form.title,
      totalAmount: parseFloat(form.amount),
      category: form.category,
      date: new Date().toISOString(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['expenses-summary'] })
      setShowAdd(false)
      setForm({ title: '', amount: '', category: 'groceries' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['expenses-summary'] })
    },
  })

  const refetch = () => { refetchSummary(); refetchExp() }

  return (
    <View style={styles.container}>
      <GradientHeader title="Expenses" gradient={Gradients.blue}>
        <View style={{ flexDirection: 'row', gap: Space.xs }}>
          <PermissionGate require="exp.write">
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </PermissionGate>
          <PermissionGate require="exp.export">
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
              onPress={() => api.get('/expenses/export').then(r => console.log('export:', r.data))}>
              <Text style={styles.addBtnText}>Export</Text>
            </TouchableOpacity>
          </PermissionGate>
        </View>
      </GradientHeader>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.blue} />}
      >
        {loadSummary
          ? <ActivityIndicator color={Colors.blue} style={{ marginTop: Space.xl }} />
          : summary && <SummaryCard summary={summary} />
        }

        <Text style={styles.sectionLabel}>Recent</Text>

        {loadExp
          ? <ActivityIndicator color={Colors.blue} />
          : expenses?.map(e => (
              <ExpenseRow key={e.id} expense={e} onDelete={() => deleteMutation.mutate(e.id)} />
            ))
        }
      </ScrollView>

      {/* Add expense modal */}
      <Modal visible={showAdd} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalBg}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add expense</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} placeholder="e.g. Weekly groceries"
              placeholderTextColor={Colors.textTertiary}
              value={form.title} onChangeText={t => setForm(f => ({ ...f, title: t }))} autoFocus />

            <Text style={styles.label}>Amount (₪)</Text>
            <TextInput style={styles.input} placeholder="0.00"
              placeholderTextColor={Colors.textTertiary}
              value={form.amount} onChangeText={t => setForm(f => ({ ...f, amount: t }))}
              keyboardType="numeric" />

            <Text style={styles.label}>Category</Text>
            <View style={styles.catPills}>
              {(Object.keys(CATEGORY_ICONS) as ExpenseCategory[]).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catPill, form.category === cat && { backgroundColor: CATEGORY_COLORS[cat] + '18', borderColor: CATEGORY_COLORS[cat] }]}
                  onPress={() => setForm(f => ({ ...f, category: cat }))}
                >
                  <Text style={{ fontSize: 16 }}>{CATEGORY_ICONS[cat]}</Text>
                  <Text style={[styles.catPillText, form.category === cat && { color: CATEGORY_COLORS[cat] }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sheetBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!form.title || !form.amount) && styles.btnDisabled]}
                disabled={!form.title || !form.amount || addMutation.isPending}
                onPress={() => addMutation.mutate()}
              >
                <LinearGradient
                  colors={Gradients.blue as unknown as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtnInner}
                >
                  {addMutation.isPending
                    ? <ActivityIndicator color={Colors.white} />
                    : <Text style={styles.saveBtnText}>Save expense</Text>
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
  container:    { flex: 1, backgroundColor: Colors.bg },
  addBtn:       { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full, paddingHorizontal: Space.lg, paddingVertical: 8 },
  addBtnText:   { fontSize: FontSize.sm, color: Colors.white, fontWeight: FontWeight.semi },
  content:      { padding: Space.lg, paddingBottom: 100 },
  summaryCard:  { marginBottom: Space.lg },
  summaryCardContent: { padding: Space.xl },
  summaryMonth: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  summaryTotal: { fontSize: 38, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginVertical: Space.sm, letterSpacing: -1.5 },
  catBar:       { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2, marginBottom: Space.md },
  catSeg:       { borderRadius: 4 },
  legend:       { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  legendItem:   { flexDirection: 'row', alignItems: 'center', gap: Space.xs },
  legendDot:    { width: 8, height: 8, borderRadius: 4 },
  legendText:   { fontSize: FontSize.xs, color: Colors.textSecondary, textTransform: 'capitalize' },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Space.md, marginTop: Space.sm },
  expRow:       { marginBottom: Space.sm },
  expRowContent: { flexDirection: 'row', alignItems: 'center', gap: Space.md, padding: Space.lg },
  expIcon:      { width: 42, height: 42, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  expInfo:      { flex: 1 },
  expTitle:     { fontSize: FontSize.md, fontWeight: FontWeight.semi, color: Colors.textPrimary },
  expMeta:      { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 3 },
  expAmount:    { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  deleteLink:   { fontSize: FontSize.xs, color: Colors.danger, marginTop: 3 },
  modalBg:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: Colors.bgCard, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Space.xl, paddingBottom: 40 },
  sheetHandle:  { width: 40, height: 5, borderRadius: 3, backgroundColor: Colors.bgSecondary, alignSelf: 'center', marginBottom: Space.xl },
  sheetTitle:   { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Space.xl },
  label:        { fontSize: FontSize.xs, fontWeight: FontWeight.semi, color: Colors.textSecondary, marginBottom: Space.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:        { backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Space.lg, paddingVertical: 14, fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Space.md },
  catPills:     { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm, marginBottom: Space.xl },
  catPill:      { flexDirection: 'row', alignItems: 'center', gap: Space.xs, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: Space.md, paddingVertical: 8 },
  catPillText:  { fontSize: FontSize.sm, color: Colors.textSecondary, textTransform: 'capitalize' },
  sheetBtns:    { flexDirection: 'row', gap: Space.md },
  cancelBtn:    { flex: 1, borderWidth: 1.5, borderColor: Colors.borderMid, borderRadius: Radius.sm, paddingVertical: 15, alignItems: 'center' },
  cancelBtnText:{ fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  saveBtn:      { flex: 1, borderRadius: Radius.sm, overflow: 'hidden' },
  saveBtnInner: { paddingVertical: 15, alignItems: 'center', borderRadius: Radius.sm },
  saveBtnText:  { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.semi },
  btnDisabled:  { opacity: 0.45 },
})