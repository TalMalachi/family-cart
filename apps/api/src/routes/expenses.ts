import type { FastifyInstance } from 'fastify'
import { CreateExpenseSchema } from '@familycart/shared/schemas'
import { db }                  from '../db/postgres'
import { requirePermission }   from '../middleware/permissions'

export async function expensesRoutes(app: FastifyInstance) {

  function getEffectiveFamilyId(request: any): string | null {
    const { familyId, isSuperAdmin } = request.user as any
    if (isSuperAdmin) {
      const qFamilyId = (request.query as any)?.familyId
      return qFamilyId || null
    }
    return familyId
  }

  // GET /expenses?month=2026-03
  app.get('/', { preHandler: requirePermission('exp.read') }, async (request) => {
    const effectiveFamilyId = getEffectiveFamilyId(request)
    const { month } = request.query as { month?: string }
    const familyFilter = effectiveFamilyId ? `and e.family_id = '${effectiveFamilyId}'` : ''

    if (month) {
      return db`
        select e.*, u.full_name as paid_by_name
        from expenses e
        join users u on u.id = e.paid_by
        where true ${db.unsafe(familyFilter)}
          and to_char(e.date, 'YYYY-MM') = ${month}
        order by e.date desc
      `
    }

    return db`
      select e.*, u.full_name as paid_by_name
      from expenses e
      join users u on u.id = e.paid_by
      where true ${db.unsafe(familyFilter)}
      order by e.date desc
      limit 50
    `
  })

  // GET /expenses/summary?month=2026-03
  app.get('/summary', { preHandler: requirePermission('exp.read') }, async (request) => {
    const effectiveFamilyId = getEffectiveFamilyId(request)
    const { month } = request.query as { month?: string }
    const target = month ?? new Date().toISOString().slice(0, 7)
    const familyFilter = effectiveFamilyId ? `and family_id = '${effectiveFamilyId}'` : ''
    const familyFilterE = effectiveFamilyId ? `and e.family_id = '${effectiveFamilyId}'` : ''

    const [totals] = await db`
      select
        coalesce(sum(total_amount), 0) as total,
        json_object_agg(category, cat_total) as by_category
      from (
        select category, sum(total_amount) as cat_total
        from expenses
        where true ${db.unsafe(familyFilter)}
          and to_char(date, 'YYYY-MM') = ${target}
        group by category
      ) t
    `

    const byMember = await db`
      select u.id, u.full_name, sum(e.total_amount) as paid
      from expenses e
      join users u on u.id = e.paid_by
      where true ${db.unsafe(familyFilterE)}
        and to_char(e.date, 'YYYY-MM') = ${target}
      group by u.id, u.full_name
    `

    return { month: target, ...totals, byMember }
  })

  // POST /expenses
  app.post('/', { preHandler: requirePermission('exp.write') }, async (request, reply) => {
    const body = CreateExpenseSchema.parse(request.body)
    const { familyId, id: userId, isSuperAdmin } = request.user as any
    const targetFamilyId = (isSuperAdmin && (request.body as any).familyId) || familyId

    const [expense] = await db`
      insert into expenses
        (family_id, title, total_amount, category, paid_by, shopping_list_id, date)
      values
        (${targetFamilyId}, ${body.title}, ${body.totalAmount}, ${body.category},
         ${userId}, ${body.shoppingListId ?? null}, ${body.date})
      returning *
    `
    return reply.status(201).send(expense)
  })

  // DELETE /expenses/:id
  app.delete('/:id', { preHandler: requirePermission('exp.delete') }, async (request, reply) => {
    const { id } = request.params as any
    const { familyId, isSuperAdmin } = request.user as any
    if (isSuperAdmin) {
      await db`delete from expenses where id = ${id}`
    } else {
      await db`delete from expenses where id = ${id} and family_id = ${familyId}`
    }
    return reply.status(204).send()
  })

  // GET /expenses/export  — CSV download
  app.get('/export', { preHandler: requirePermission('exp.export') }, async (request, reply) => {
    const effectiveFamilyId = getEffectiveFamilyId(request)
    const familyFilter = effectiveFamilyId ? `and e.family_id = '${effectiveFamilyId}'` : ''

    const rows = await db`
      select e.date, e.title, e.category, e.total_amount, u.full_name as paid_by
      from expenses e
      join users u on u.id = e.paid_by
      where true ${db.unsafe(familyFilter)}
      order by e.date desc
    `

    const header = 'date,title,category,amount,paid_by\n'
    const csv = header + rows.map((r: any) =>
      `${r.date},${JSON.stringify(r.title)},${r.category},${r.totalAmount},${JSON.stringify(r.paidBy)}`
    ).join('\n')

    reply.header('Content-Type', 'text/csv')
    reply.header('Content-Disposition', 'attachment; filename="expenses.csv"')
    return csv
  })
}
