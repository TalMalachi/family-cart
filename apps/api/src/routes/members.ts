import type { FastifyInstance } from 'fastify'
import { SaveWhatsAppGroupSchema } from '@familycart/shared/schemas'
import { db }                  from '../db/postgres'
import { env }                 from '../../config/env'
import { requirePermission, invalidatePermissionCache } from '../middleware/permissions'


export async function membersRoutes(app: FastifyInstance) {

  // GET /members  — list all active members in the family
  app.get('/', { preHandler: requirePermission('lists.read') }, async (request) => {
    const { familyId, isSuperAdmin } = request.user as any
    const qFamilyId = (request.query as any)?.familyId
    if (isSuperAdmin && !qFamilyId) {
      // Super-admin: return all members across all families
      return db`
        select fm.id, fm.role, fm.status, fm.joined_at,
               u.id as user_id, u.full_name, u.phone, u.email,
               u.must_change_password, u.is_super_admin,
               f.name as family_name, f.id as family_id
        from family_members fm
        join users u on u.id = fm.user_id
        join families f on f.id = fm.family_id
        order by f.name, fm.joined_at asc
      `
    }
    const effectiveFamilyId = (isSuperAdmin && qFamilyId) || familyId
    return db`
      select fm.id, fm.role, fm.status, fm.joined_at,
             u.id as user_id, u.full_name, u.phone, u.email,
             u.must_change_password, u.is_super_admin
      from family_members fm
      join users u on u.id = fm.user_id
      where fm.family_id = ${effectiveFamilyId}
      order by fm.joined_at asc
    `
  })

  // ─── WhatsApp group link ────────────────────────────────────────
  // Stored on the family so all members share the same link.

  // GET /members/whatsapp-group  — get the saved WhatsApp group link
  app.get('/whatsapp-group', { preHandler: requirePermission('lists.read') }, async (request) => {
    const { familyId } = request.user as any
    const [family] = await db`
      select whatsapp_group_link from families where id = ${familyId}
    `
    return { link: family?.whatsappGroupLink ?? null }
  })

  // PUT /members/whatsapp-group  — save or update the WhatsApp group link (admin only)
  app.put('/whatsapp-group', { preHandler: requirePermission('mem.perms') }, async (request, reply) => {
    const { familyId } = request.user as any
    const parsed = SaveWhatsAppGroupSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_input', message: parsed.error.message })
    }
    const { link } = parsed.data
    await db`update families set whatsapp_group_link = ${link} where id = ${familyId}`
    return { link }
  })

  // DELETE /members/whatsapp-group  — remove the saved WhatsApp group link (admin only)
  app.delete('/whatsapp-group', { preHandler: requirePermission('mem.perms') }, async (request, reply) => {
    const { familyId } = request.user as any
    await db`update families set whatsapp_group_link = null where id = ${familyId}`
    return reply.status(204).send()
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

  // PATCH /members/:memberId/profile  — edit member display name / phone / email
  app.patch('/:memberId/profile', { preHandler: requirePermission('mem.perms') }, async (request, reply) => {
    const { memberId } = request.params as any
    const { familyId } = request.user as any
    const { fullName, phone, email } = request.body as { fullName?: string; phone?: string; email?: string }

    if (!fullName && !phone && !email) {
      return reply.status(400).send({ error: 'no_fields_to_update' })
    }

    const [target] = await db`
      select fm.user_id, u.full_name, u.phone, u.email
      from family_members fm
      join users u on u.id = fm.user_id
      where fm.id = ${memberId} and fm.family_id = ${familyId}
    `
    if (!target) return reply.status(404).send({ error: 'not_found' })

    const updates: Record<string, string> = {}

    if (fullName) {
      const v = fullName.trim()
      if (v.length < 2 || v.length > 80) return reply.status(400).send({ error: 'invalid_full_name' })
      if (v !== target.fullName) updates.full_name = v
    }

    if (phone) {
      const v = phone.trim()
      if (!/^\+?[1-9]\d{7,14}$/.test(v)) return reply.status(400).send({ error: 'invalid_phone' })
      if (v !== target.phone) updates.phone = v
    }

    if (email) {
      const v = email.trim().toLowerCase()
      if (!/^\S+@\S+\.\S+$/.test(v)) return reply.status(400).send({ error: 'invalid_email' })
      if (v !== (target.email ?? '').toLowerCase()) updates.email = v
    }

    if (Object.keys(updates).length === 0) {
      return reply.status(200).send({
        id: target.userId,
        fullName: target.fullName,
        phone: target.phone,
        email: target.email,
      })
    }

    try {
      const [user] = await db`
        update users set ${db(updates)}
        where id = ${target.userId}
        returning id, full_name, phone, email
      `
      return reply.status(200).send(user)
    } catch (err: any) {
      if (err?.code === '23505') {
        return reply.status(409).send({ error: 'email_or_phone_already_exists' })
      }
      throw err
    }
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

  // GET /members/:memberId/qr  — return login QR data for a member
  app.get('/:memberId/qr', { preHandler: requirePermission('mem.perms') }, async (request, reply) => {
    const { memberId } = request.params as any
    const { familyId } = request.user as any

    const [target] = await db`
      select u.full_name, u.phone, u.email
      from family_members fm
      join users u on u.id = fm.user_id
      where fm.id = ${memberId} and fm.family_id = ${familyId}
    `
    if (!target) return reply.status(404).send({ error: 'not_found' })

    // QR login uses the member's email as the pre-filled identity
    const loginId = target.email || target.phone || ''

    // Build a login URL reachable from phones on the same Wi-Fi:
    //  1. APP_URL env (explicitly configured)
    //  2. HOST_LAN_IP env (auto-detected by start.sh on the host machine)
    //  3. Request Host header (whatever the admin's browser used to reach the portal)
    let baseUrl: string
    if (env.APP_URL) {
      baseUrl = env.APP_URL.replace(/\/+$/, '')
    } else if (env.HOST_LAN_IP) {
      baseUrl = `http://${env.HOST_LAN_IP}:${env.PORT}`
    } else {
      const host = (request.headers['host'] as string) || `localhost:${env.PORT}`
      const proto = (request.headers['x-forwarded-proto'] as string) || 'http'
      baseUrl = `${proto}://${host}`
    }

    // Use /auth/m/<base64url> short redirect — keeps the URL clean
    // (no @, ?, = characters) so WhatsApp auto-links it correctly.
    const code = Buffer.from(loginId).toString('base64url')
    const loginUrl = `${baseUrl}/auth/m/${code}`

    return {
      fullName: target.fullName,
      phone:    target.phone,
      email:    target.email,
      loginId,
      loginUrl,
    }
  })

  // PATCH /members/:memberId/status  — admin updates member lifecycle status
  app.patch('/:memberId/status', { preHandler: requirePermission('mem.perms') }, async (request, reply) => {
    const { memberId } = request.params as any
    const { familyId, id: adminId } = request.user as any
    const { status } = request.body as { status: 'register' | 'active' | 'suspended' | 'deleted' }

    const allowed = new Set(['register', 'active', 'suspended', 'deleted'])
    if (!allowed.has(status)) {
      return reply.status(400).send({ error: 'invalid_status' })
    }

    const [target] = await db`
      select user_id from family_members
      where id = ${memberId} and family_id = ${familyId}
    `
    if (!target) return reply.status(404).send({ error: 'not_found' })

    // Avoid locking yourself out by mistake.
    if (target.userId === adminId && status !== 'active') {
      return reply.status(400).send({ error: 'cannot_change_own_status' })
    }

    await db`
      update family_members set status = ${status}
      where id = ${memberId} and family_id = ${familyId}
    `

    await invalidatePermissionCache(target.userId, familyId)
    return reply.status(200).send({ status })
  })
}
