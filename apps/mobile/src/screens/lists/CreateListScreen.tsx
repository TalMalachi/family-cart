import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Colors, FontSize, FontWeight, Radius, Space, Gradients } from '../../utils/theme'

export default function CreateListScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const [name, setName] = useState('')

  const createMutation = useMutation({
    mutationFn: () => api.post('/lists', { name: name.trim() }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['lists'] })
      router.replace(`/(tabs)/lists/${res.data.id}`)
    },
  })

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={Gradients.teal as unknown as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.navBar}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.navBackBtn}>
          <Text style={styles.navBack}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>New list</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.label}>List name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Weekly groceries"
          placeholderTextColor={Colors.textTertiary}
          value={name}
          onChangeText={setName}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={() => name.trim() && createMutation.mutate()}
        />

        <TouchableOpacity
          style={[styles.createBtn, !name.trim() && styles.btnDisabled]}
          disabled={!name.trim() || createMutation.isPending}
          onPress={() => createMutation.mutate()}
        >
          <LinearGradient
            colors={Gradients.teal as unknown as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createBtnInner}
          >
            {createMutation.isPending
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.createBtnText}>Create list</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        {createMutation.isError && (
          <Text style={styles.error}>
            {(createMutation.error as any)?.response?.data?.message || 'Failed to create list'}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex:           { flex: 1, backgroundColor: Colors.bg },
  navBar:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Space.xl, paddingTop: 60, paddingBottom: Space.lg, gap: Space.sm },
  navBackBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  navBack:        { fontSize: FontSize.lg, color: Colors.white },
  navTitle:       { flex: 1, fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white },
  content:        { padding: Space.xl },
  label:          { fontSize: FontSize.xs, fontWeight: FontWeight.semi, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Space.xs },
  input:          { backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Space.lg, paddingVertical: 14, fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Space.xl },
  createBtn:      { borderRadius: Radius.sm, overflow: 'hidden' },
  createBtnInner: { paddingVertical: 16, alignItems: 'center', borderRadius: Radius.sm },
  createBtnText:  { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.semi },
  btnDisabled:    { opacity: 0.45 },
  error:          { marginTop: Space.md, fontSize: FontSize.sm, color: Colors.danger, textAlign: 'center' },
})