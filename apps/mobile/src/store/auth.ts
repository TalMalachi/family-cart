import { create }          from 'zustand'
import * as SecureStore     from 'expo-secure-store'
import type { Role, PermissionKey } from '@familycart/shared'
import { resolvePermissions, ROLE_PERMISSIONS } from '@familycart/shared/permissions'
import { api }              from '../services/api'

interface AuthUser {
  id: string
  familyId: string
  familySlug: string
  fullName: string
  role: Role
  isSuperAdmin: boolean
  permissions: Set<PermissionKey>
  mustChangePassword: boolean
}

interface FamilyOption {
  slug: string
  name: string
}

interface AuthStore {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  familyOptions: FamilyOption[] | null // populated when multi-family selection needed

  // Actions
  login: (phoneOrEmail: string, password: string, familySlug?: string) => Promise<void>
  logout: () => Promise<void>
  setToken: (token: string) => Promise<void>
  refreshPermissions: () => Promise<void>
  can: (key: PermissionKey) => boolean
  clearFamilyOptions: () => void
}

const TOKEN_KEY = 'familycart_token'

export const useAuth = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  familyOptions: null,

  login: async (phoneOrEmail, password, familySlug?) => {
    try {
      const payload: any = { phoneOrEmail, password }
      if (familySlug) payload.familySlug = familySlug
      const { data } = await api.post('/auth/login', payload)
      set({ familyOptions: null })
      await get().setToken(data.token)
    } catch (e: any) {
      if (e?.response?.status === 422 && e?.response?.data?.error === 'family_required') {
        set({ familyOptions: e.response.data.families })
        throw e
      }
      throw e
    }
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
        familySlug: payload.familySlug ?? '',
        fullName: payload.fullName ?? '',
        role: payload.role,
        isSuperAdmin: payload.isSuperAdmin ?? false,
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
    if (get().user?.isSuperAdmin) return true
    return get().user?.permissions.has(key) ?? false
  },

  clearFamilyOptions: () => set({ familyOptions: null }),
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
