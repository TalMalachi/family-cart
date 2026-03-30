import type { FastifyRequest, FastifyReply, preHandlerHookHandler } from 'fastify'
import type { PermissionKey } from '@familycart/shared'
import { resolvePermissions }  from '@familycart/shared/permissions'
import { redis }               from '../db/redis'
import { db }                  from '../db/postgres'

// ─── Resolve & cache permissions for a user ───────────────────────────────────

export async function getUserPermissions(
  userId: string,
  familyId: string
): Promise<Set<PermissionKey>> {
  const cacheKey = `perms:${userId}:${familyId}`

  // 1. Try Redis cache first (5 min TTL)
  const cached = await redis.get(cacheKey)
  if (cached) {
    return new Set(JSON.parse(cached) as PermissionKey[])
  }

  // 2. Load role + overrides from DB
  const [memberRow] = await db`
    select role from family_members
    where user_id = ${userId}
      and family_id = ${familyId}
      and status = 'active'
    limit 1
  `
  if (!memberRow) return new Set()

  const overrides = await db`
    select upo.permission_key, upo.granted
    from user_permission_overrides upo
    join family_members fm on fm.id = upo.family_member_id
    where fm.user_id   = ${userId}
      and fm.family_id = ${familyId}
  `

  // 3. Resolve using shared logic (same function used client-side)
  const perms = resolvePermissions(memberRow.role, overrides as any)

  // 4. Cache for 5 minutes
  await redis.set(cacheKey, JSON.stringify([...perms]), 'EX', 300)

  return perms
}

// ─── Invalidate cache when admin changes overrides ────────────────────────────

export async function invalidatePermissionCache(
  userId: string,
  familyId: string
): Promise<void> {
  await redis.del(`perms:${userId}:${familyId}`)
}

// ─── Route guard factory ──────────────────────────────────────────────────────
// Usage: fastify.post('/lists', { preHandler: requirePermission('lists.create') }, handler)

export function requirePermission(key: PermissionKey): preHandlerHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // 1. Must be authenticated
    if (!request.user) {
      return reply.status(401).send({ error: 'unauthorized', message: 'Login required' })
    }

    const { id: userId, familyId, isSuperAdmin } = request.user as { id: string; familyId: string; isSuperAdmin?: boolean }

    // 2. Set current user context for RLS
    await db`select set_config('app.current_user_id', ${userId}, true)`

    // 3. Super-admin bypasses all permission checks
    if (isSuperAdmin) return

    // 4. Check permission
    const perms = await getUserPermissions(userId, familyId)

    if (!perms.has(key)) {
      return reply.status(403).send({
        error: 'forbidden',
        message: `Permission required: ${key}`,
        required: key,
      })
    }
  }
}

// ─── Require authenticated (no specific permission) ───────────────────────────

export const requireAuth: preHandlerHookHandler = async (request, reply) => {
  if (!request.user) {
    return reply.status(401).send({ error: 'unauthorized', message: 'Login required' })
  }
  const { id: userId } = request.user as { id: string }
  await db`select set_config('app.current_user_id', ${userId}, true)`
}

// ─── Require admin role ───────────────────────────────────────────────────────

export const requireAdmin: preHandlerHookHandler = async (request, reply) => {
  if (!request.user) {
    return reply.status(401).send({ error: 'unauthorized', message: 'Login required' })
  }
  const { id: userId, familyId, isSuperAdmin } = request.user as { id: string; familyId: string; isSuperAdmin?: boolean }

  // Super-admin bypasses admin check
  if (isSuperAdmin) {
    await db`select set_config('app.current_user_id', ${userId}, true)`
    return
  }

  const [row] = await db`
    select role from family_members
    where user_id = ${userId} and family_id = ${familyId} and status = 'active'
  `
  if (!row || row.role !== 'admin') {
    return reply.status(403).send({ error: 'forbidden', message: 'Admin role required' })
  }
}

// ─── Require super-admin ──────────────────────────────────────────────────────

export const requireSuperAdmin: preHandlerHookHandler = async (request, reply) => {
  if (!request.user) {
    return reply.status(401).send({ error: 'unauthorized', message: 'Login required' })
  }
  const { isSuperAdmin } = request.user as { isSuperAdmin?: boolean }
  if (!isSuperAdmin) {
    return reply.status(403).send({ error: 'forbidden', message: 'Super admin required' })
  }
}
