// Append to apps/api/src/routes/lists.ts
// These two routes support the ProductDetailScreen

// GET /lists/items/:itemId  — full item with images + alternatives
// (add this inside listsRoutes function)
/*
  app.get('/items/:itemId', { preHandler: requirePermission('lists.read') }, async (request, reply) => {
    const { itemId } = request.params as { itemId: string }

    const [item] = await db`
      select si.*,
        coalesce(
          json_agg(distinct jsonb_build_object(
            'id', pi.id, 'url', pi.url, 'isPrimary', pi.is_primary,
            'uploadedBy', pi.uploaded_by, 'uploadedAt', pi.uploaded_at
          )) filter (where pi.id is not null),
          '[]'
        ) as images,
        coalesce(
          json_agg(distinct jsonb_build_object(
            'id', ap.id, 'name', ap.name, 'note', ap.note,
            'priority', ap.priority, 'imageUrl', ap.image_url
          )) filter (where ap.id is not null),
          '[]'
        ) as alternatives
      from shopping_items si
      left join product_images pi on pi.item_id = si.id
      left join alternative_products ap on ap.item_id = si.id
      where si.id = ${itemId}
      group by si.id
    `
    if (!item) return reply.status(404).send({ error: 'not_found' })
    return item
  })
*/

// DELETE /lists/alternatives/:altId  — remove an alternative product
// (add this inside listsRoutes function)
/*
  app.delete('/alternatives/:altId', { preHandler: requirePermission('lists.write') }, async (request, reply) => {
    const { altId } = request.params as { altId: string }
    await db`delete from alternative_products where id = ${altId}`
    return reply.status(204).send()
  })
*/

export {}  // keep TypeScript happy as a module
