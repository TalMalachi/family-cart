import type { FastifyInstance } from 'fastify'
import {
  CreateListSchema, CreateItemSchema,
  UpdateItemSchema, AddAlternativeSchema,
} from '@familycart/shared/schemas'
import { db }                from '../db/postgres'
import { requirePermission } from '../middleware/permissions'

export async function listsRoutes(app: FastifyInstance) {

  app.get('/', { preHandler: requirePermission('lists.read') }, async (request) => {
    const { familyId } = request.user as any
    return db`
      select sl.*,
        count(si.id)::int as item_count,
        count(si.id) filter (where si.is_purchased)::int as purchased_count
      from shopping_lists sl
      left join shopping_items si on si.list_id = sl.id
      where sl.family_id = ${familyId}
      group by sl.id
      order by sl.created_at desc
    `
  })

  app.get('/:id', { preHandler: requirePermission('lists.read') }, async (request, reply) => {
    const { id } = request.params as any
    const { familyId } = request.user as any
    const [list] = await db`select * from shopping_lists where id = ${id} and family_id = ${familyId}`
    if (!list) return reply.status(404).send({ error: 'not_found' })
    const items = await db`
      select si.*,
        coalesce(json_agg(distinct jsonb_build_object(
          'id', pi.id, 'url', pi.url, 'isPrimary', pi.is_primary,
          'uploadedBy', pi.uploaded_by, 'uploadedAt', pi.uploaded_at
        )) filter (where pi.id is not null), '[]') as images,
        coalesce(json_agg(distinct jsonb_build_object(
          'id', ap.id, 'name', ap.name, 'note', ap.note, 'priority', ap.priority
        )) filter (where ap.id is not null), '[]') as alternatives
      from shopping_items si
      left join product_images pi on pi.item_id = si.id
      left join alternative_products ap on ap.item_id = si.id
      where si.list_id = ${id}
      group by si.id order by si.created_at asc
    `
    return { ...list, items }
  })

  app.get('/items/:itemId', { preHandler: requirePermission('lists.read') }, async (request, reply) => {
    const { itemId } = request.params as any
    const [item] = await db`
      select si.*,
        coalesce(json_agg(distinct jsonb_build_object(
          'id', pi.id, 'url', pi.url, 'isPrimary', pi.is_primary,
          'uploadedBy', pi.uploaded_by, 'uploadedAt', pi.uploaded_at
        )) filter (where pi.id is not null), '[]') as images,
        coalesce(json_agg(distinct jsonb_build_object(
          'id', ap.id, 'name', ap.name, 'note', ap.note, 'priority', ap.priority
        )) filter (where ap.id is not null), '[]') as alternatives
      from shopping_items si
      left join product_images pi on pi.item_id = si.id
      left join alternative_products ap on ap.item_id = si.id
      where si.id = ${itemId}
      group by si.id
    `
    if (!item) return reply.status(404).send({ error: 'not_found' })
    return item
  })

  app.post('/', { preHandler: requirePermission('lists.create') }, async (request, reply) => {
    const body = CreateListSchema.parse(request.body)
    const { familyId, id: userId } = request.user as any
    const [list] = await db`
      insert into shopping_lists (family_id, name, created_by)
      values (${familyId}, ${body.name}, ${userId}) returning *
    `
    return reply.status(201).send(list)
  })

  app.patch('/:id', { preHandler: requirePermission('lists.write') }, async (request) => {
    const { id } = request.params as any
    const { familyId } = request.user as any
    const body = request.body as any
    const updates: Record<string, any> = {}
    for (const k of ['name', 'status']) if (k in body) updates[k] = body[k]
    if (body.status === 'completed') updates.completed_at = new Date()
    const [list] = await db`
      update shopping_lists set ${db(updates)} where id = ${id} and family_id = ${familyId} returning *
    `
    return list
  })

  app.delete('/:id', { preHandler: requirePermission('lists.delete') }, async (request, reply) => {
    const { id } = request.params as any
    const { familyId } = request.user as any
    await db`delete from shopping_lists where id = ${id} and family_id = ${familyId}`
    return reply.status(204).send()
  })

  app.post('/:id/items', { preHandler: requirePermission('lists.write') }, async (request, reply) => {
    const body = CreateItemSchema.parse(request.body)
    const { id: userId } = request.user as any
    const { id: listId } = request.params as any
    const [item] = await db`
      insert into shopping_items (list_id, name, quantity, unit, estimated_price, category, created_by)
      values (${listId}, ${body.name}, ${body.quantity}, ${body.unit ?? null},
              ${body.estimatedPrice ?? null}, ${body.category ?? null}, ${userId})
      returning *
    `
    return reply.status(201).send(item)
  })

  app.patch('/items/:itemId', { preHandler: requirePermission('lists.write') }, async (request) => {
    const { itemId } = request.params as any
    const { id: userId } = request.user as any
    const body = UpdateItemSchema.parse(request.body)
    const updates: Record<string, any> = { ...body, updated_at: new Date() }
    if (body.isPurchased === true)  { updates.purchased_by = userId;  updates.purchased_at = new Date() }
    if (body.isPurchased === false) { updates.purchased_by = null;    updates.purchased_at = null }
    const [item] = await db`update shopping_items set ${db(updates)} where id = ${itemId} returning *`
    return item
  })

  app.delete('/items/:itemId', { preHandler: requirePermission('lists.write') }, async (request, reply) => {
    const { itemId } = request.params as any
    await db`delete from shopping_items where id = ${itemId}`
    return reply.status(204).send()
  })

  app.post('/items/:itemId/alternatives', { preHandler: requirePermission('lists.write') }, async (request, reply) => {
    const body = AddAlternativeSchema.parse(request.body)
    const { itemId } = request.params as any
    const [alt] = await db`
      insert into alternative_products (item_id, name, note, priority)
      values (${itemId}, ${body.name}, ${body.note ?? null}, ${body.priority}) returning *
    `
    return reply.status(201).send(alt)
  })

  app.delete('/items/:itemId/alternatives/:altId', { preHandler: requirePermission('lists.write') }, async (request, reply) => {
    const { altId } = request.params as any
    await db`delete from alternative_products where id = ${altId}`
    return reply.status(204).send()
  })
}
