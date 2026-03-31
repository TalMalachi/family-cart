import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { db } from '../db/postgres'
import { requireSuperAdmin } from '../middleware/permissions'

export async function adminRoutes(app: FastifyInstance) {

  // GET /admin/families — list all families (super-admin only)
  app.get('/families', { preHandler: requireSuperAdmin }, async () => {
    return db`
      select f.id, f.name, f.slug, f.created_at,
        count(distinct fm.id)::int as member_count,
        count(distinct sl.id)::int as list_count
      from families f
      left join family_members fm on fm.family_id = f.id and fm.status = 'active'
      left join shopping_lists sl on sl.family_id = f.id
      group by f.id
      order by f.created_at desc
    `
  })

  // POST /admin/families — create a new family (super-admin only)
  app.post('/families', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const schema = z.object({ name: z.string().min(2).max(80) })
    const body = schema.parse(request.body)
    const { id: userId } = request.user as any

    let slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const [existing] = await db`select 1 from families where slug = ${slug}`
    if (existing) slug = slug + '-' + nanoid(4)

    const [family] = await db`
      insert into families (name, slug, created_by)
      values (${body.name}, ${slug}, ${userId})
      returning *
    `
    return reply.status(201).send(family)
  })

  // PATCH /admin/families/:id — rename a family (super-admin only)
  app.patch('/families/:id', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const { id } = request.params as any
    const schema = z.object({ name: z.string().min(2).max(80) })
    const body = schema.parse(request.body)

    const [family] = await db`select * from families where id = ${id}`
    if (!family) return reply.status(404).send({ error: 'not_found' })

    // Update name and regenerate slug
    let slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const [existing] = await db`select 1 from families where slug = ${slug} and id != ${id}`
    if (existing) slug = slug + '-' + nanoid(4)

    const [updated] = await db`
      update families set name = ${body.name}, slug = ${slug}
      where id = ${id} returning *
    `
    return updated
  })

  // DELETE /admin/families/:id — delete a family (super-admin only)
  app.delete('/families/:id', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const { id } = request.params as any

    const [family] = await db`select * from families where id = ${id}`
    if (!family) return reply.status(404).send({ error: 'not_found' })

    // Check if family still has active members
    const [{ count }] = await db`
      select count(*)::int as count from family_members
      where family_id = ${id} and status = 'active'
    `
    if (count > 0) {
      return reply.status(400).send({
        error: 'family_has_members',
        message: `Cannot delete family with ${count} active member(s). Move or remove them first.`,
      })
    }

    await db`delete from families where id = ${id}`
    return reply.status(204).send()
  })

  // PATCH /admin/members/:memberId/family — move a member to a different family (super-admin only)
  app.patch('/members/:memberId/family', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const { memberId } = request.params as any
    const { familyId } = request.body as { familyId: string }

    if (!familyId) return reply.status(400).send({ error: 'family_id_required' })

    const [member] = await db`select * from family_members where id = ${memberId}`
    if (!member) return reply.status(404).send({ error: 'member_not_found' })

    const [family] = await db`select id from families where id = ${familyId}`
    if (!family) return reply.status(404).send({ error: 'family_not_found' })

    // Check if user already has a membership in the target family
    const [existing] = await db`
      select id from family_members
      where user_id = ${member.userId} and family_id = ${familyId}
    `
    if (existing) {
      // Update existing membership
      await db`
        update family_members set role = ${member.role}, status = 'active'
        where id = ${existing.id}
      `
      // Remove old membership
      await db`delete from family_members where id = ${memberId}`
      return { memberId: existing.id, familyId }
    }

    // Move to new family
    await db`
      update family_members set family_id = ${familyId}
      where id = ${memberId}
    `
    return { memberId, familyId }
  })

  // PATCH /admin/users/:userId/super-admin — promote/demote sys_admin (super-admin only)
  app.patch('/users/:userId/super-admin', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const { userId } = request.params as any
    const { isSuperAdmin: grant } = request.body as { isSuperAdmin: boolean }
    const { id: currentUserId } = request.user as any

    if (userId === currentUserId) {
      return reply.status(400).send({ error: 'cannot_change_self', message: 'Cannot change your own sys_admin status' })
    }

    const [user] = await db`select id from users where id = ${userId}`
    if (!user) return reply.status(404).send({ error: 'user_not_found' })

    await db`update users set is_super_admin = ${grant} where id = ${userId}`
    return { userId, isSuperAdmin: grant }
  })
}