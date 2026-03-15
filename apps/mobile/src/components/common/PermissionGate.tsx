import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { PermissionKey }     from '@familycart/shared'
import { useAuth }                from '../../store/auth'

interface Props {
  require: PermissionKey | PermissionKey[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Wraps any UI element that requires a specific permission.
 * If the user lacks the permission, renders `fallback` (or nothing).
 *
 * Usage:
 *   <PermissionGate require="lists.create">
 *     <CreateListButton />
 *   </PermissionGate>
 *
 *   <PermissionGate require="mem.invite" fallback={<Text>Ask your admin</Text>}>
 *     <InviteButton />
 *   </PermissionGate>
 */
export function PermissionGate({ require, fallback = null, children }: Props) {
  const { can } = useAuth()

  const keys = Array.isArray(require) ? require : [require]
  const allowed = keys.every(k => can(k))

  return <>{allowed ? children : fallback}</>
}

/**
 * Hook version — useful inside handlers/effects.
 * const canDelete = usePermission('lists.delete')
 */
export function usePermission(key: PermissionKey): boolean {
  return useAuth(state => state.can(key))
}
