import type { FastifyInstance } from 'fastify'
import bcrypt   from 'bcryptjs'
import { nanoid } from 'nanoid'
import {
  LoginSchema, RegisterSchema,
  VerifySmsSchema, SetPasswordSchema,
  InviteMemberSchema,
} from '@familycart/shared/schemas'
import { db }    from '../db/postgres'
import { redis } from '../db/redis'
import { sms }   from '../services/sms'
import { requirePermission } from '../middleware/permissions'

export async function authRoutes(app: FastifyInstance) {

  // POST /auth/login
  app.post('/login', async (request, reply) => {
    const body = LoginSchema.parse(request.body)

    const [user] = await db`
      select id, password_hash, must_change_password
      from users
      where phone = ${body.phoneOrEmail}
         or email = ${body.phoneOrEmail}
      limit 1
    `
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return reply.status(401).send({ error: 'invalid_credentials' })
    }

    // Load family context (first active membership)
    const [membership] = await db`
      select family_id, role from family_members
      where user_id = ${user.id} and status = 'active'
      limit 1
    `

    const token = app.jwt.sign(
      {
        id:       user.id,
        familyId: membership?.familyId,
        role:     membership?.role,
        mustChangePassword: user.mustChangePassword,
      },
      { expiresIn: '7d' }
    )

    return { token, mustChangePassword: user.mustChangePassword }
  })

  // POST /auth/register  (creates user + family, role = admin)
  app.post('/register', async (request, reply) => {
    const body = RegisterSchema.parse(request.body)

    const hash = await bcrypt.hash(body.password, 12)

    const [user] = await db`
      insert into users (full_name, phone, email, password_hash)
      values (${body.fullName}, ${body.phone}, ${body.email}, ${hash})
      returning id
    `

    // Create family if admin is registering fresh
    let familyId: string
    if (body.role === 'admin') {
      const [family] = await db`
        insert into families (name, created_by)
        values (${body.familyName ?? body.fullName + "'s family"}, ${user.id})
        returning id
      `
      familyId = family.id
    } else {
      return reply.status(400).send({ error: 'use_invite_flow' })
    }

    await db`
      insert into family_members (user_id, family_id, role, status)
      values (${user.id}, ${familyId}, 'admin', 'active')
    `

    const token = app.jwt.sign(
      { id: user.id, familyId, role: 'admin', mustChangePassword: false },
      { expiresIn: '7d' }
    )
    return reply.status(201).send({ token })
  })

  // POST /auth/invite  — admin sends SMS to new member
  app.post('/invite', {
    preHandler: requirePermission('mem.invite'),
  }, async (request, reply) => {
    const body    = InviteMemberSchema.parse(request.body)
    const { familyId, id: invitedBy } = request.user as any

    // Generate 6-digit OTP
    const otp  = String(Math.floor(100000 + Math.random() * 900000))
    const hash = await bcrypt.hash(otp, 10)

    await db`
      insert into invitations
        (family_id, phone, full_name, role, otp_hash, invited_by, expires_at)
      values (
        ${familyId}, ${body.phone}, ${body.fullName}, ${body.role},
        ${hash}, ${invitedBy},
        now() + interval '15 minutes'
      )
    `

    await sms.send(body.phone, `Your FamilyCart invite code: ${otp}. Expires in 15 min.`)

    return reply.status(201).send({ message: 'Invitation sent' })
  })

  // POST /auth/verify-sms  — member enters 6-digit code
  app.post('/verify-sms', async (request, reply) => {
    const body = VerifySmsSchema.parse(request.body)

    const [invite] = await db`
      select id, family_id, full_name, role, otp_hash, expires_at
      from invitations
      where phone = ${body.phone}
        and status = 'pending'
        and expires_at > now()
      order by created_at desc
      limit 1
    `
    if (!invite) {
      return reply.status(400).send({ error: 'invalid_or_expired_code' })
    }

    const valid = await bcrypt.compare(body.code, invite.otpHash)
    if (!valid) {
      return reply.status(400).send({ error: 'invalid_or_expired_code' })
    }

    // Issue a short-lived must_change_password token
    const tempToken = app.jwt.sign(
      {
        inviteId:           invite.id,
        phone:              body.phone,
        familyId:           invite.familyId,
        role:               invite.role,
        mustChangePassword: true,
      },
      { expiresIn: '30m' }
    )

    return { tempToken, fullName: invite.fullName }
  })

  // POST /auth/set-password  — completes onboarding after SMS verify
  app.post('/set-password', async (request, reply) => {
    const body  = SetPasswordSchema.parse(request.body)
    const claim = app.jwt.verify(body.token) as any

    if (!claim.mustChangePassword) {
      return reply.status(400).send({ error: 'token_not_for_password_reset' })
    }

    const hash = await bcrypt.hash(body.password, 12)

    // Create user account
    const [user] = await db`
      insert into users (full_name, phone, password_hash, must_change_password)
      select full_name, phone, ${hash}, false
      from invitations where id = ${claim.inviteId}
      returning id
    `

    // Activate membership
    await db`
      insert into family_members (user_id, family_id, role, status)
      values (${user.id}, ${claim.familyId}, ${claim.role}, 'active')
    `

    // Mark invite as accepted
    await db`
      update invitations set status = 'accepted' where id = ${claim.inviteId}
    `

    const token = app.jwt.sign(
      { id: user.id, familyId: claim.familyId, role: claim.role, mustChangePassword: false },
      { expiresIn: '7d' }
    )
    return { token }
  })
}
