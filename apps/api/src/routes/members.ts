import type { FastifyInstance } from 'fastify'
import { db }                  from '../db/postgres'
import { requirePermission, invalidatePermissionCache } from '../middleware/permissions'

export async function membersRoutes(app: FastifyInstance) {

  // GET /members  — list all active members in the family
  app.get('/', { preHandler: requirePermission('lists.read') }, async (request) => {
    const { familyId } = request.user as any
    return db`
      select fm.id, fm.role, fm.status, fm.joined_at,
             u.id as user_id, u.full_name, u.phone, u.email
      from family_members fm
      join users u on u.id = fm.user_id
      where fm.family_id = ${familyId}
      order by fm.joined_at asc
    `
  })

  // DELETE /members/:memberId  — remove a member from the family
  app.delete('/:memberId', { preHandler: requirePermission('mem.remove') }, async (request, reply) => {
    const { memberId } = request.params as any
    const { familyId, id: adminId } = request.user as any

    // Cannot remove yourself
    const [target] = await db`
      select user_id from family_members
      where id = ${memberId} and family_id = ${familyId}
    `
    if (!target) return reply.status(404).send({ error: 'not_found' })
    if (target.userId === adminId) {
      return reply.status(400).send({ error: 'cannot_remove_self' })
    }

    await db`
      update family_members
      set status = 'suspended'
      where id = ${memberId} and family_id = ${familyId}
    `

    await invalidatePermissionCache(target.userId, familyId)
    return reply.status(204).send()
  })

  // PATCH /members/:memberId/role  — promote/demote role
  app.patch('/:memberId/role', { preHandler: requirePermission('mem.perms') }, async (request, reply) => {
    const { memberId } = request.params as any
    const { familyId, id: adminId } = request.user as any
    const { role } = request.body as { role: 'admin' | 'member' }

    const [target] = await db`
      select user_id from family_members
      where id = ${memberId} and family_id = ${familyId}
    `
    if (!target) return reply.status(404).send({ error: 'not_found' })
    if (target.userId === adminId) {
      return reply.status(400).send({ error: 'cannot_change_own_role' })
    }

    await db`
      update family_members set role = ${role}
      where id = ${memberId} and family_id = ${familyId}
    `

    await invalidatePermissionCache(target.userId, familyId)
    return reply.status(200).send({ role })
  })
}
