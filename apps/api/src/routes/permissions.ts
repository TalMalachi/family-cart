import type { FastifyInstance } from 'fastify'
import { UpdatePermissionsSchema } from '@familycart/shared/schemas'
import { ROLE_PERMISSIONS }        from '@familycart/shared/permissions'
import { db }                      from '../db/postgres'
import { requirePermission, requireAdmin, invalidatePermissionCache } from '../middleware/permissions'

export async function permissionsRoutes(app: FastifyInstance) {

  // GET /permissions/member/:memberId
  // Returns a member's current resolved permissions + overrides
  app.get('/member/:memberId', {
    preHandler: requirePermission('mem.perms'),
  }, async (request, reply) => {
    const { memberId } = request.params as { memberId: string }
    const { familyId } = request.user as any

    const [member] = await db`
      select fm.id, fm.role, fm.user_id, u.full_name
      from family_members fm
      join users u on u.id = fm.user_id
      where fm.id = ${memberId}
        and fm.family_id = ${familyId}
        and fm.status = 'active'
    `
    if (!member) return reply.status(404).send({ error: 'member_not_found' })

    const overrides = await db`
      select permission_key, granted, granted_at
      from user_permission_overrides
      where family_member_id = ${memberId}
    `

    // Compute resolved set server-side for the response
    const roleDefaults = ROLE_PERMISSIONS[member.role as 'admin' | 'member']
    const resolved     = new Set(roleDefaults)
    for (const o of overrides) {
      if (o.granted) resolved.add(o.permissionKey)
      else           resolved.delete(o.permissionKey)
    }

    return {
      memberId,
      userId:   member.userId,
      fullName: member.fullName,
      role:     member.role,
      roleDefaults,
      overrides,
      resolved: [...resolved],
    }
  })

  // PUT /permissions/member/:memberId
  // Replaces the full set of overrides for a member
  app.put('/member/:memberId', {
    preHandler: requirePermission('mem.perms'),
  }, async (request, reply) => {
    const { memberId } = request.params as { memberId: string }
    const { familyId, id: adminId } = request.user as any
    const body = UpdatePermissionsSchema.parse(request.body)

    // Verify member belongs to this family
    const [member] = await db`
      select id, user_id, role from family_members
      where id = ${memberId} and family_id = ${familyId}
    `
    if (!member) return reply.status(404).send({ error: 'member_not_found' })

    // Admins cannot have their own permissions reduced by another admin
    // (only a higher-level guard would handle super-admin, out of scope here)

    // Upsert all overrides in a transaction
    await db.begin(async sql => {
      // Remove overrides not in the new list
      const incomingKeys = body.overrides.map(o => o.permissionKey)

      if (incomingKeys.length > 0) {
        await sql`
          delete from user_permission_overrides
          where family_member_id = ${memberId}
            and permission_key != all(${incomingKeys})
        `
      } else {
        await sql`
          delete from user_permission_overrides
          where family_member_id = ${memberId}
        `
      }

      // Upsert each override
      for (const override of body.overrides) {
        await sql`
          insert into user_permission_overrides
            (family_member_id, permission_key, granted, granted_by)
          values
            (${memberId}, ${override.permissionKey}, ${override.granted}, ${adminId})
          on conflict (family_member_id, permission_key)
          do update set
            granted    = excluded.granted,
            granted_by = excluded.granted_by,
            granted_at = now()
        `
      }
    })

    // Invalidate Redis cache for this user
    await invalidatePermissionCache(member.userId, familyId)

    return reply.status(200).send({ message: 'Permissions updated' })
  })

  // DELETE /permissions/member/:memberId/reset
  // Remove all overrides — resets to pure role defaults
  app.delete('/member/:memberId/reset', {
    preHandler: requirePermission('mem.perms'),
  }, async (request, reply) => {
    const { memberId } = request.params as { memberId: string }
    const { familyId } = request.user as any

    const [member] = await db`
      select user_id from family_members
      where id = ${memberId} and family_id = ${familyId}
    `
    if (!member) return reply.status(404).send({ error: 'member_not_found' })

    await db`
      delete from user_permission_overrides
      where family_member_id = ${memberId}
    `

    await invalidatePermissionCache(member.userId, familyId)

    return { message: 'Reset to role defaults' }
  })
}
