// ─── Users & Auth ────────────────────────────────────────────────────────────

export type Role = 'admin' | 'member'

export type MemberStatus = 'register' | 'active' | 'suspended' | 'deleted'

export interface User {
  id: string
  email: string
  phone: string
  fullName: string
  createdAt: string
}

export interface FamilyMember {
  id: string
  userId: string
  familyId: string
  role: Role
  status: MemberStatus
  joinedAt: string
  user: Pick<User, 'id' | 'fullName' | 'phone'>
}

export interface Family {
  id: string
  name: string
  createdBy: string
  createdAt: string
  members: FamilyMember[]
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export type PermissionKey =
  | 'lists.read'   | 'lists.write'   | 'lists.create'   | 'lists.delete'
  | 'exp.read'     | 'exp.write'     | 'exp.export'     | 'exp.delete'
  | 'mem.invite'   | 'mem.remove'    | 'mem.perms'
  | 'med.view'     | 'med.upload'    | 'med.delete'

export interface Permission {
  key: PermissionKey
  api: 'lists' | 'expenses' | 'members' | 'media'
  action: string
  description: string
}

export interface UserPermissionOverride {
  familyMemberId: string
  permissionKey: PermissionKey
  granted: boolean         // true = grant above role, false = revoke below role
  grantedBy: string
  grantedAt: string
}

export interface ResolvedPermissions {
  userId: string
  familyId: string
  role: Role
  permissions: Set<PermissionKey>
  overrides: UserPermissionOverride[]
}

// ─── Invitations ─────────────────────────────────────────────────────────────

export interface Invitation {
  id: string
  familyId: string
  phone: string
  fullName: string
  role: Role
  status: 'pending' | 'accepted' | 'expired'
  invitedBy: string
  expiresAt: string
  createdAt: string
}

// ─── Shopping Lists ───────────────────────────────────────────────────────────

export interface ProductImage {
  id: string
  url: string
  isPrimary: boolean
  uploadedBy: string
  uploadedAt: string
}

export interface AlternativeProduct {
  id: string
  name: string
  note?: string              // e.g. "if main brand not available"
  priority: 'preferred' | 'fallback'
  image?: ProductImage
}

export interface ShoppingItem {
  id: string
  listId: string
  name: string
  quantity: number
  unit?: string
  estimatedPrice?: number
  category?: string
  isPurchased: boolean
  purchasedBy?: string
  purchasedAt?: string
  images: ProductImage[]
  alternatives: AlternativeProduct[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ShoppingList {
  id: string
  familyId: string
  name: string
  status: 'active' | 'completed' | 'archived'
  completedAt?: string
  createdBy: string
  createdAt: string
  items: ShoppingItem[]
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export type ExpenseCategory = 'groceries' | 'household' | 'personal' | 'pharmacy' | 'other'

export interface Expense {
  id: string
  familyId: string
  title: string
  totalAmount: number
  category: ExpenseCategory
  paidBy: string
  shoppingListId?: string    // linked list, if applicable
  date: string
  createdAt: string
}

export interface ExpenseSummary {
  month: string              // 'YYYY-MM'
  total: number
  byCategory: Record<ExpenseCategory, number>
  byMember: Record<string, number>
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiError {
  error: string
  message: string
  required?: PermissionKey   // set when 403
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
