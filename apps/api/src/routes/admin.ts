import type { FastifyInstance } from 'fastify'
import { db } from '../db/postgres'
import { requireSuperAdmin } from '../middleware/permissions'

export async function adminRoutes(app: FastifyInstance) {

  // GET /admin/families — list all families (super-admin only)
  app.get('/families', { preHandler: requireSuperAdmin }, async () => {
    return db`
      select f.id, f.name, f.slug, f.created_at,
        count(fm.id)::int as member_count,
        count(sl.id)::int as list_count
      from families f
      left join family_members fm on fm.family_id = f.id and fm.status = 'active'
      left join shopping_lists sl on sl.family_id = f.id
      group by f.id
      order by f.created_at desc
    `
  })
}