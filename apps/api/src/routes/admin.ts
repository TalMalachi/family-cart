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
}