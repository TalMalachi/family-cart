import type { FastifyInstance } from 'fastify'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl }  from '@aws-sdk/s3-request-presigner'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { nanoid }        from 'nanoid'
import { db }            from '../db/postgres'
import { env }           from '../../config/env'
import { requirePermission } from '../middleware/permissions'

const s3 = new S3Client({
  endpoint:        env.S3_ENDPOINT,
  region:          'auto',
  credentials: {
    accessKeyId:     env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
})

export async function mediaRoutes(app: FastifyInstance) {

  // POST /media/presign  — get a signed URL to upload directly from device
  app.post('/presign', { preHandler: requirePermission('med.upload') }, async (request, reply) => {
    const { itemId, contentType } = request.body as {
      itemId?: string
      contentType?: 'image/jpeg' | 'image/png' | 'image/webp'
    }
    const { id: userId, familyId } = request.user as any

    // Validate body
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!itemId || typeof itemId !== 'string' || !contentType || !validTypes.includes(contentType)) {
      return reply.status(400).send({ error: 'invalid_body', message: 'itemId (string) and contentType (image/jpeg|image/png|image/webp) are required' })
    }

    // Verify target item exists
    const [item] = await db`select * from shopping_items where id = ${itemId}`
    if (!item) return reply.status(404).send({ error: 'not_found' })

    // Verify parent list belongs to user's family
    const [list] = await db`select * from shopping_lists where id = ${item.listId}`
    if (!list) return reply.status(404).send({ error: 'not_found' })
    if (list.familyId !== familyId) return reply.status(403).send({ error: 'forbidden' })

    const key = `items/${itemId}/${nanoid()}`
    const command = new PutObjectCommand({
      Bucket:      env.S3_BUCKET,
      Key:         key,
      ContentType: contentType,
    })

    const uploadUrl  = await getSignedUrl(s3, command, { expiresIn: 300 }) // 5 min
    const publicUrl  = `${env.S3_PUBLIC_URL}/${key}`

    // Pre-register the image row (will be confirmed client-side after upload)
    const [image] = await db`
      insert into product_images (item_id, url, uploaded_by)
      values (${itemId}, ${publicUrl}, ${userId})
      returning id, url
    `

    return { imageId: image.id, uploadUrl, publicUrl }
  })

  // PATCH /media/:imageId/primary  — set as the primary product image
  app.patch('/:imageId/primary', { preHandler: requirePermission('med.upload') }, async (request, reply) => {
    const { imageId } = request.params as any
    const { familyId } = request.user as any

    // Verify image exists
    const [img] = await db`select item_id from product_images where id = ${imageId}`
    if (!img) return reply.status(404).send({ error: 'not_found' })

    // Verify owning item exists
    const [item] = await db`select * from shopping_items where id = ${img.itemId}`
    if (!item) return reply.status(404).send({ error: 'not_found' })

    // Verify parent list belongs to user's family
    const [list] = await db`select * from shopping_lists where id = ${item.listId}`
    if (!list) return reply.status(404).send({ error: 'not_found' })
    if (list.familyId !== familyId) return reply.status(403).send({ error: 'forbidden' })

    // Clear existing primary, set new one
    await db.begin(async sql => {
      await sql`
        update product_images set is_primary = false where item_id = ${img.itemId}
      `
      await sql`
        update product_images set is_primary = true where id = ${imageId}
      `
    })
    return { success: true }
  })

  // DELETE /media/:imageId
  app.delete('/:imageId', { preHandler: requirePermission('med.delete') }, async (request, reply) => {
    const { imageId } = request.params as any
    const { familyId } = request.user as any

    // Verify image exists
    const [img] = await db`select * from product_images where id = ${imageId}`
    if (!img) return reply.status(404).send({ error: 'not_found' })

    // Verify owning item exists
    const [item] = await db`select * from shopping_items where id = ${img.itemId}`
    if (!item) return reply.status(404).send({ error: 'not_found' })

    // Verify parent list belongs to user's family
    const [list] = await db`select * from shopping_lists where id = ${item.listId}`
    if (!list) return reply.status(404).send({ error: 'not_found' })
    if (list.familyId !== familyId) return reply.status(403).send({ error: 'forbidden' })

    // Delete from DB
    await db`delete from product_images where id = ${imageId}`

    // Delete from R2/S3
    const key = img.url.replace(`${env.S3_PUBLIC_URL}/`, '')
    await s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }))

    return reply.status(204).send()
  })
}
