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
import { env }   from '../../config/env'
import { requirePermission } from '../middleware/permissions'

export async function authRoutes(app: FastifyInstance) {

  // GET /auth/portal  — redirect to full web dashboard
  app.get('/portal', async (_request, reply) => {
    return reply.redirect('/app')
  })

  // GET /auth/m/:code  — short redirect for QR / WhatsApp login links.
  // :code is the login email/phone encoded as base64url so the URL
  // contains no @, ?, = characters (which break WhatsApp link detection).
  app.get('/m/:code', async (request, reply) => {
    const { code } = request.params as any
    try {
      const loginId = Buffer.from(code, 'base64url').toString('utf-8')
      return reply.redirect(`/auth/login?user=${encodeURIComponent(loginId)}`)
    } catch {
      return reply.redirect('/auth/login')
    }
  })

  // GET /auth/login  (browser login page)
  app.get('/login', async (_request, reply) => {
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FamilyCart Login</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f7fb; margin: 0; }
    .card { max-width: 420px; margin: 64px auto; background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    h1 { margin: 0 0 16px; font-size: 22px; }
    label { display: block; margin: 12px 0 6px; font-size: 14px; color: #334155; }
    input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; }
    button { width: 100%; margin-top: 16px; padding: 11px 12px; border: 0; border-radius: 8px; background: #0f766e; color: #fff; font-weight: 600; cursor: pointer; }
    button:disabled { opacity: 0.7; cursor: not-allowed; }
    .hint { margin-top: 10px; font-size: 12px; color: #64748b; }
    .ok, .err { margin-top: 12px; padding: 10px; border-radius: 8px; font-size: 13px; white-space: pre-wrap; word-break: break-word; }
    .ok { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .err { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
  </style>
</head>
<body>
  <main class="card">
    <h1>FamilyCart Login</h1>
    <form id="loginForm">
      <label for="phoneOrEmail">Phone or email</label>
      <input id="phoneOrEmail" name="phoneOrEmail" placeholder="admin@familycart.local" required />

      <label for="password">Password</label>
      <input id="password" name="password" type="password" placeholder="********" required />

      <button id="submitBtn" type="submit">Login</button>
      <p class="hint">Uses POST /auth/login and returns JWT token.</p>
      <div id="message"></div>
    </form>
  </main>

  <script>
    const form = document.getElementById('loginForm');
    const message = document.getElementById('message');
    const submitBtn = document.getElementById('submitBtn');

    // Pre-fill phone/email from QR code URL (?user=...)
    (function prefillFromQR() {
      const params = new URLSearchParams(window.location.search);
      const user = params.get('user');
      if (user) {
        document.getElementById('phoneOrEmail').value = user;
        document.getElementById('password').focus();
      }
    })();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      message.className = '';
      message.textContent = '';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';

      const payload = {
        phoneOrEmail: document.getElementById('phoneOrEmail').value,
        password: document.getElementById('password').value,
      };

      try {
        const res = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const raw = await res.text();
        let data = {};
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          data = { message: raw || 'Unexpected response' };
        }

        if (!res.ok) {
          message.className = 'err';
          message.textContent = data.error || data.message || 'Login failed';
          return;
        }

        if (data.token) {
          localStorage.setItem('familycart_token', data.token);
        }

        message.className = 'ok';
        message.textContent = 'Login successful. Redirecting to portal...';
        setTimeout(() => {
          window.location.href = '/auth/portal';
        }, 400);
      } catch (err) {
        message.className = 'err';
        message.textContent = 'Network error';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
      }
    });
  </script>
</body>
</html>`

    return reply.type('text/html; charset=utf-8').send(html)
  })

  // GET /auth/accept-invite  (browser page for invited members to set password)
  app.get('/accept-invite', async (_request, reply) => {
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FamilyCart — Accept Invite</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f7fb; margin: 0; }
    .card { max-width: 420px; margin: 64px auto; background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    h1 { margin: 0 0 8px; font-size: 22px; }
    .subtitle { color: #64748b; font-size: 14px; margin: 0 0 20px; }
    label { display: block; margin: 12px 0 6px; font-size: 14px; color: #334155; }
    input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; }
    button { width: 100%; margin-top: 16px; padding: 11px 12px; border: 0; border-radius: 8px; background: #0f766e; color: #fff; font-weight: 600; cursor: pointer; }
    button:disabled { opacity: 0.7; cursor: not-allowed; }
    .ok, .err { margin-top: 12px; padding: 10px; border-radius: 8px; font-size: 13px; }
    .ok { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .err { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .req { font-size: 12px; color: #94a3b8; margin-top: 4px; }
  </style>
</head>
<body>
  <main class="card">
    <h1>Welcome to FamilyCart</h1>
    <p class="subtitle">Set your password to complete your account setup.</p>
    <form id="form">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" placeholder="Min 8 characters" required minlength="8" />
      <p class="req">At least 8 characters, 1 uppercase, 1 number or symbol</p>

      <label for="confirmPassword">Confirm password</label>
      <input id="confirmPassword" name="confirmPassword" type="password" placeholder="Re-enter password" required />

      <button id="submitBtn" type="submit">Set Password</button>
      <div id="message"></div>
    </form>
  </main>

  <script>
    const form = document.getElementById('form');
    const message = document.getElementById('message');
    const submitBtn = document.getElementById('submitBtn');
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      message.className = 'err';
      message.textContent = 'Invalid invite link — no token found.';
      submitBtn.disabled = true;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pw = document.getElementById('password').value;
      const cpw = document.getElementById('confirmPassword').value;

      if (pw !== cpw) {
        message.className = 'err';
        message.textContent = 'Passwords do not match.';
        return;
      }

      message.className = '';
      message.textContent = '';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Setting password...';

      try {
        const res = await fetch('/auth/set-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password: pw, confirmPassword: cpw }),
        });
        const data = await res.json();

        if (!res.ok) {
          message.className = 'err';
          message.textContent = data.error || 'Something went wrong.';
          return;
        }

        message.className = 'ok';
        message.innerHTML = 'Password set! You can now log in.<br><br>'
          + '1. Install <b>Expo Go</b> on your phone<br>'
          + '2. Open the FamilyCart app<br>'
          + '3. Log in with your email and new password';
        form.style.display = 'none';
      } catch (err) {
        message.className = 'err';
        message.textContent = 'Network error. Please try again.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Set Password';
      }
    });
  </script>
</body>
</html>`

    return reply.type('text/html; charset=utf-8').send(html)
  })

  // POST /auth/login
  app.post('/login', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, async (request, reply) => {
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

    // Only members with active status can login.
    if (!membership) {
      return reply.status(403).send({ error: 'account_inactive', message: 'Only active members can login' })
    }

    const token = app.jwt.sign(
      {
        id:       user.id,
        familyId: membership.familyId,
        role:     membership.role,
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

  // POST /auth/invite  — admin invites new member
  app.post('/invite', {
    preHandler: requirePermission('mem.invite'),
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const parsed = InviteMemberSchema.safeParse(request.body)
    if (!parsed.success) {
      const fieldErrors = parsed.error.issues.map(issue => {
        const field = issue.path.join('.')
        return `${field}: ${issue.message}`
      })
      return reply.status(400).send({
        error: 'invalid_payload',
        message: `Invalid fields: ${fieldErrors.join('; ')}`,
        fields: parsed.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      })
    }
    const body = parsed.data
    const { familyId, id: invitedBy } = request.user as any

    // Ensure invited person exists by email, while phone can be non-unique.
    const tempHash = await bcrypt.hash(nanoid(16), 8)
    let invitedUser: { id: string }
    try {
      ;[invitedUser] = await db`
        insert into users (full_name, phone, email, password_hash, must_change_password)
        values (${body.fullName}, ${body.phone}, ${body.email}, ${tempHash}, true)
        on conflict (email)
        do update set
          full_name = excluded.full_name,
          phone = excluded.phone,
          must_change_password = true
        returning id
      `
    } catch (err: any) {
      if (err?.code === '23505') {
        return reply.status(409).send({ error: 'email_already_exists' })
      }
      throw err
    }

    await db`
      insert into family_members (user_id, family_id, role, status)
      values (${invitedUser.id}, ${familyId}, ${body.role}, 'active')
      on conflict (user_id, family_id)
      do update set role = excluded.role, status = 'active'
    `

    // Generate OTP and store invitation
    const otp  = String(Math.floor(100000 + Math.random() * 900000))
    const otpHash = await bcrypt.hash(otp, 10)

    const [invitation] = await db`
      insert into invitations
        (family_id, phone, email, full_name, role, otp_hash, invited_by, expires_at)
      values (
        ${familyId}, ${body.phone}, ${body.email}, ${body.fullName}, ${body.role},
        ${otpHash}, ${invitedBy},
        now() + interval '7 days'
      )
      returning id
    `

    // Generate invite token (same shape as verify-sms tempToken, so set-password works as-is)
    const inviteToken = app.jwt.sign(
      {
        inviteId:           invitation.id,
        phone:              body.phone,
        familyId,
        role:               body.role,
        mustChangePassword: true,
      },
      { expiresIn: '7d' }
    )

    const baseUrl = env.APP_URL || `http://${request.hostname}`
    const inviteUrl = `${baseUrl}/auth/accept-invite?token=${encodeURIComponent(inviteToken)}`

    // Send SMS if Twilio is configured, otherwise admin shares the link manually
    if (env.TWILIO_SID && env.TWILIO_TOKEN) {
      await sms.send(body.phone, `You're invited to FamilyCart! Set your password: ${inviteUrl}`)
    }

    return reply.status(201).send({ message: 'Invitation created', inviteToken, inviteUrl })
  })

  // PUT /auth/admin-set-password  — admin sets/resets a member's password
  app.put('/admin-set-password', {
    preHandler: requirePermission('mem.perms'),
  }, async (request, reply) => {
    const { userId, password } = request.body as { userId?: string; password?: string }
    const { familyId } = request.user as any

    if (!userId || !password) {
      return reply.status(400).send({ error: 'invalid_payload', message: 'userId and password are required' })
    }
    if (password.length < 8) {
      return reply.status(400).send({ error: 'invalid_payload', message: 'Password must be at least 8 characters' })
    }

    // Verify target user is a member of the same family
    const [member] = await db`
      select fm.user_id from family_members fm
      where fm.user_id = ${userId} and fm.family_id = ${familyId} and fm.status = 'active'
    `
    if (!member) {
      return reply.status(404).send({ error: 'member_not_found', message: 'User is not an active member of your family' })
    }

    const hash = await bcrypt.hash(password, 12)
    await db`
      update users set password_hash = ${hash}, must_change_password = false
      where id = ${userId}
    `

    return { message: 'Password updated successfully' }
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

    // Upsert user account by invited email (email is the unique identity).
    const [user] = await db`
      insert into users (full_name, phone, email, password_hash, must_change_password)
      select full_name, phone, email, ${hash}, false
      from invitations where id = ${claim.inviteId}
      on conflict (email)
      do update set
        full_name = excluded.full_name,
        phone = excluded.phone,
        password_hash = excluded.password_hash,
        must_change_password = false
      returning id
    `

    // Activate membership (upsert in case invite already created it)
    await db`
      insert into family_members (user_id, family_id, role, status)
      values (${user.id}, ${claim.familyId}, ${claim.role}, 'active')
      on conflict (user_id, family_id)
      do update set role = excluded.role, status = 'active'
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
