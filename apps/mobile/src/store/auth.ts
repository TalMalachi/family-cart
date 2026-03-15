import { create }          from 'zustand'
import * as SecureStore     from 'expo-secure-store'
import type { Role, PermissionKey } from '@familycart/shared'
import { resolvePermissions, ROLE_PERMISSIONS } from '@familycart/shared/permissions'
import { api }              from '../services/api'

interface AuthUser {
  id: string
  familyId: string
  fullName: string
  role: Role
  permissions: Set<PermissionKey>
  mustChangePassword: boolean
}

interface AuthStore {
  user: AuthUser | null
  token: string | null
  isLoading: boolean

  // Actions
  login: (phoneOrEmail: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setToken: (token: string) => Promise<void>
  refreshPermissions: () => Promise<void>
  can: (key: PermissionKey) => boolean
}

const TOKEN_KEY = 'familycart_token'

export const useAuth = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  login: async (phoneOrEmail, password) => {
    const { data } = await api.post('/auth/login', { phoneOrEmail, password })
    await get().setToken(data.token)
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    set({ user: null, token: null })
  },

  setToken: async (token) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token)

    // Decode JWT payload (no verification — server already did it)
    const payload = JSON.parse(atob(token.split('.')[1]))

    // Build permission set from role (overrides come from server on refresh)
    const permissions = new Set<PermissionKey>(
      ROLE_PERMISSIONS[payload.role as Role]
    )

    set({
      token,
      user: {
        id: payload.id,
        familyId: payload.familyId,
        fullName: payload.fullName ?? '',
        role: payload.role,
        permissions,
        mustChangePassword: payload.mustChangePassword ?? false,
      },
    })
  },

  // Fetch server-resolved permissions (includes per-user overrides)
  refreshPermissions: async () => {
    const { token } = get()
    if (!token) return
    const { data } = await api.get('/permissions/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    set(state => ({
      user: state.user
        ? { ...state.user, permissions: new Set(data.resolved as PermissionKey[]) }
        : null,
    }))
  },

  can: (key) => {
    return get().user?.permissions.has(key) ?? false
  },
}))

// Restore session on app start
export async function restoreSession() {
  const token = await SecureStore.getItemAsync(TOKEN_KEY)
  if (token) {
    await useAuth.getState().setToken(token)
    await useAuth.getState().refreshPermissions()
  }
  useAuth.setState({ isLoading: false })
}
