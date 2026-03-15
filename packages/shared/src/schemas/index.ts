import { z } from 'zod'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  phoneOrEmail: z.string().min(4),
  password: z.string().min(8),
})

export const RegisterSchema = z.object({
  fullName: z.string().min(2).max(80),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number'),
  email: z.string().email(),
  password: z.string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9!@#$%^&*]/, 'Must contain number or symbol'),
  role: z.enum(['admin', 'member']),
  familyName: z.string().min(2).max(80).optional(),
})

export const VerifySmsSchema = z.object({
  phone: z.string(),
  code: z.string().length(6).regex(/^\d{6}$/),
})

export const SetPasswordSchema = z.object({
  token: z.string(),           // short-lived must_change_password JWT
  password: z.string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9!@#$%^&*]/),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// ─── Invitations ──────────────────────────────────────────────────────────────

export const InviteMemberSchema = z.object({
  fullName: z.string().min(2).max(80),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/),
  role: z.enum(['admin', 'member']),
})

// ─── Permission overrides ─────────────────────────────────────────────────────

export const UpdatePermissionsSchema = z.object({
  familyMemberId: z.string().uuid(),
  overrides: z.array(z.object({
    permissionKey: z.string(),
    granted: z.boolean(),
  })),
})

// ─── Shopping Lists ───────────────────────────────────────────────────────────

export const CreateListSchema = z.object({
  name: z.string().min(1).max(120),
})

export const CreateItemSchema = z.object({
  listId: z.string().uuid(),
  name: z.string().min(1).max(200),
  quantity: z.number().positive(),
  unit: z.string().max(20).optional(),
  estimatedPrice: z.number().nonnegative().optional(),
  category: z.string().max(60).optional(),
})

export const UpdateItemSchema = CreateItemSchema.partial().extend({
  isPurchased: z.boolean().optional(),
})

export const AddAlternativeSchema = z.object({
  itemId: z.string().uuid(),
  name: z.string().min(1).max(200),
  note: z.string().max(300).optional(),
  priority: z.enum(['preferred', 'fallback']),
})

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const CreateExpenseSchema = z.object({
  title: z.string().min(1).max(200),
  totalAmount: z.number().positive(),
  category: z.enum(['groceries', 'household', 'personal', 'pharmacy', 'other']),
  shoppingListId: z.string().uuid().optional(),
  date: z.string().datetime(),
})
