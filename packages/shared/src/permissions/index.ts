import type { PermissionKey, Role } from '../types'

// ─── All permissions in the system ───────────────────────────────────────────

export const ALL_PERMISSIONS: Record<PermissionKey, { api: string; description: string }> = {
  'lists.read':    { api: 'lists',    description: 'View all family shopping lists' },
  'lists.write':   { api: 'lists',    description: 'Add, edit, remove items' },
  'lists.create':  { api: 'lists',    description: 'Start a new shopping list' },
  'lists.delete':  { api: 'lists',    description: 'Permanently remove a list' },

  'exp.read':      { api: 'expenses', description: 'View family expense history' },
  'exp.write':     { api: 'expenses', description: 'Log new purchases' },
  'exp.export':    { api: 'expenses', description: 'Download CSV / reports' },
  'exp.delete':    { api: 'expenses', description: 'Remove expense records' },

  'mem.invite':    { api: 'members',  description: 'Send SMS invitations' },
  'mem.remove':    { api: 'members',  description: 'Revoke family access' },
  'mem.perms':     { api: 'members',  description: 'Edit per-user permission overrides' },

  'med.view':      { api: 'media',    description: 'View product photos' },
  'med.upload':    { api: 'media',    description: 'Attach photos to products' },
  'med.delete':    { api: 'media',    description: 'Remove product photos' },
}

// ─── Role defaults ────────────────────────────────────────────────────────────
// Admin gets everything. Member gets the safe read/write subset.

export const ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
  admin: Object.keys(ALL_PERMISSIONS) as PermissionKey[],

  member: [
    'lists.read',
    'lists.write',
    'exp.read',
    'exp.write',
    'med.view',
    'med.upload',
  ],
}

// ─── Permission resolver ──────────────────────────────────────────────────────
// Merges role defaults + per-user overrides.
// Called server-side; result is cached in Redis.

export interface OverrideRecord {
  permissionKey: PermissionKey
  granted: boolean
}

export function resolvePermissions(
  role: Role,
  overrides: OverrideRecord[]
): Set<PermissionKey> {
  const perms = new Set<PermissionKey>(ROLE_PERMISSIONS[role])

  for (const override of overrides) {
    if (override.granted) {
      perms.add(override.permissionKey)
    } else {
      perms.delete(override.permissionKey)
    }
  }

  return perms
}

export function hasPermission(
  perms: Set<PermissionKey>,
  required: PermissionKey
): boolean {
  return perms.has(required)
}

// Grouped for UI rendering
export const PERMISSION_GROUPS = [
  {
    api: 'lists',
    label: 'Shopping lists',
    keys: ['lists.read', 'lists.write', 'lists.create', 'lists.delete'] as PermissionKey[],
  },
  {
    api: 'expenses',
    label: 'Expenses',
    keys: ['exp.read', 'exp.write', 'exp.export', 'exp.delete'] as PermissionKey[],
  },
  {
    api: 'members',
    label: 'Members (admin only)',
    keys: ['mem.invite', 'mem.remove', 'mem.perms'] as PermissionKey[],
  },
  {
    api: 'media',
    label: 'Media',
    keys: ['med.view', 'med.upload', 'med.delete'] as PermissionKey[],
  },
]
