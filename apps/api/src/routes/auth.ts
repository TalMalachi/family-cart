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
      <input id="phoneOrEmail" placeholder="admin@familycart.local" required autocomplete="username" />

      <input id="familySlug" type="hidden" value="" />

      <label for="password">Password</label>
      <input id="password" type="password" placeholder="********" required autocomplete="current-password" />

      <button id="submitBtn" type="submit">Login</button>
      <div id="familyPicker" style="display:none;margin-top:12px"></div>
      <div id="message"></div>
    </form>
    <p class="hint" style="margin-top:16px;text-align:center"><a href="/auth/sys-login" style="color:#6C5CE7;text-decoration:none;font-weight:600">System Admin Login</a></p>
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

      const familySlug = document.getElementById('familySlug').value.trim();
      const payload = {
        phoneOrEmail: document.getElementById('phoneOrEmail').value,
        password: document.getElementById('password').value,
      };
      if (familySlug) payload.familySlug = familySlug;

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

        if (res.status === 422 && data.error === 'family_required') {
          var picker = document.getElementById('familyPicker');
          picker.innerHTML = '<label style="margin:0 0 6px;display:block;font-size:14px;color:#334155">Select your family:</label>';
          data.families.forEach(function(f) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.style.cssText = 'display:block;width:100%;margin:4px 0;padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;cursor:pointer;font-size:14px;text-align:left';
            btn.textContent = f.name + ' (' + f.slug + ')';
            btn.onclick = function() {
              document.getElementById('familySlug').value = f.slug;
              picker.style.display = 'none';
              document.getElementById('loginForm').requestSubmit();
            };
            picker.appendChild(btn);
          });
          picker.style.display = 'block';
          return;
        }

        if (!res.ok) {
          message.className = 'err';
          if (data.error === 'invalid_credentials') message.textContent = 'Incorrect email/phone or password. Please try again.';
          else if (data.error === 'account_inactive') message.textContent = 'Your account is not active. Please contact your family admin.';
          else if (data.error === 'not_family_member') message.textContent = 'You are not a member of this family.';
          else message.textContent = data.message || data.error || 'Login failed';
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

  // GET /auth/sys-login  (browser login page for system administrators)
  app.get('/sys-login', async (_request, reply) => {
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FamilyCart — System Admin</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); margin: 0; min-height: 100vh; }
    .card { max-width: 420px; margin: 64px auto; background: #fff; border-radius: 12px; padding: 28px; box-shadow: 0 16px 48px rgba(0,0,0,0.2); }
    h1 { margin: 0 0 4px; font-size: 22px; color: #1e1b4b; }
    .subtitle { margin: 0 0 20px; font-size: 13px; color: #6366f1; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    label { display: block; margin: 12px 0 6px; font-size: 14px; color: #334155; }
    input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; }
    button { width: 100%; margin-top: 16px; padding: 11px 12px; border: 0; border-radius: 8px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; font-weight: 600; cursor: pointer; font-size: 14px; }
    button:hover { opacity: 0.95; }
    button:disabled { opacity: 0.7; cursor: not-allowed; }
    .ok, .err { margin-top: 12px; padding: 10px; border-radius: 8px; font-size: 13px; white-space: pre-wrap; word-break: break-word; }
    .ok { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .err { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .back { display: block; text-align: center; margin-top: 16px; font-size: 13px; color: #94a3b8; text-decoration: none; }
    .back:hover { color: #6366f1; }
  </style>
</head>
<body>
  <main class="card">
    <h1>System Admin</h1>
    <p class="subtitle">FamilyCart Administration</p>
    <form id="loginForm">
      <label for="phoneOrEmail">Email</label>
      <input id="phoneOrEmail" placeholder="admin@familycart.local" required autocomplete="username" />

      <label for="password">Password</label>
      <input id="password" type="password" placeholder="********" required autocomplete="current-password" />

      <button id="submitBtn" type="submit">Sign in as System Admin</button>
      <div id="message"></div>
    </form>
    <a class="back" href="/auth/login">&larr; Regular login</a>
  </main>

  <script>
    const form = document.getElementById('loginForm');
    const message = document.getElementById('message');
    const submitBtn = document.getElementById('submitBtn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      message.className = '';
      message.textContent = '';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      try {
        const res = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneOrEmail: document.getElementById('phoneOrEmail').value,
            password: document.getElementById('password').value,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          message.className = 'err';
          if (data.error === 'invalid_credentials') message.textContent = 'Incorrect email or password.';
          else message.textContent = data.message || data.error || 'Login failed';
          return;
        }

        // Verify the user is actually a sys_admin
        try {
          const payload = JSON.parse(atob(data.token.split('.')[1]));
          if (!payload.isSuperAdmin) {
            message.className = 'err';
            message.textContent = 'This account is not a System Admin. Use the regular login page.';
            return;
          }
        } catch { }

        localStorage.setItem('familycart_token', data.token);
        message.className = 'ok';
        message.textContent = 'Welcome, System Admin. Redirecting...';
        setTimeout(() => { window.location.href = '/app'; }, 400);
      } catch (err) {
        message.className = 'err';
        message.textContent = 'Network error';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign in as System Admin';
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
      select id, full_name, password_hash, must_change_password, is_super_admin
      from users
      where phone = ${body.phoneOrEmail}
         or email = ${body.phoneOrEmail}
      limit 1
    `
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return reply.status(401).send({ error: 'invalid_credentials' })
    }

    // sys_admin doesn't need a family membership
    if (user.isSuperAdmin) {
      const token = app.jwt.sign(
        {
          id:       user.id,
          familyId: null,
          familySlug: null,
          fullName: user.fullName,
          role:     'admin',
          isSuperAdmin: true,
          mustChangePassword: user.mustChangePassword,
        },
        { expiresIn: '7d' }
      )
      return { token, mustChangePassword: user.mustChangePassword }
    }

    // Load family context for regular users
    let membership: any
    if (body.familySlug) {
      ;[membership] = await db`
        select fm.family_id, fm.role, f.slug as family_slug, f.name as family_name
        from family_members fm
        join families f on f.id = fm.family_id
        where fm.user_id = ${user.id} and fm.status = 'active'
          and f.slug = ${body.familySlug}
        limit 1
      `
      if (!membership) {
        return reply.status(403).send({ error: 'not_family_member', message: 'You are not a member of this family' })
      }
    } else {
      const memberships = await db`
        select fm.family_id, fm.role, f.slug as family_slug, f.name as family_name
        from family_members fm
        join families f on f.id = fm.family_id
        where fm.user_id = ${user.id} and fm.status = 'active'
        order by fm.joined_at asc
      `
      if (memberships.length === 0) {
        return reply.status(403).send({ error: 'account_inactive', message: 'No active family membership' })
      }
      if (memberships.length > 1) {
        return reply.status(422).send({
          error: 'family_required',
          message: 'Please select a family to log into',
          families: memberships.map((m: any) => ({ slug: m.familySlug, name: m.familyName })),
        })
      }
      membership = memberships[0]
    }

    const token = app.jwt.sign(
      {
        id:       user.id,
        familyId: membership.familyId,
        familySlug: membership.familySlug,
        fullName: user.fullName,
        role:     membership.role,
        isSuperAdmin: false,
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
      const familyName = body.familyName ?? body.fullName + "'s family"
      let slug = familyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      // Ensure slug uniqueness
      const [existing] = await db`select 1 from families where slug = ${slug}`
      if (existing) {
        slug = slug + '-' + nanoid(4)
      }
      const [family] = await db`
        insert into families (name, slug, created_by)
        values (${familyName}, ${slug}, ${user.id})
        returning id, slug
      `
      familyId = family.id
    } else {
      return reply.status(400).send({ error: 'use_invite_flow' })
    }

    await db`
      insert into family_members (user_id, family_id, role, status)
      values (${user.id}, ${familyId}, 'admin', 'active')
    `

    // Look up the family slug for the JWT
    const [regFamily] = await db`select slug from families where id = ${familyId}`
    const token = app.jwt.sign(
      { id: user.id, familyId, familySlug: regFamily.slug, fullName: body.fullName, role: 'admin', isSuperAdmin: false, mustChangePassword: false },
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
    const { familyId: jwtFamilyId, id: invitedBy, isSuperAdmin: callerIsSuperAdmin } = request.user as any
    // sys_admin can specify which family to invite into
    const familyId = (callerIsSuperAdmin && (request.body as any).familyId) || jwtFamilyId
    if (!familyId) {
      return reply.status(400).send({ error: 'family_required', message: 'Please select a family to invite into' })
    }

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

  // POST /auth/invite/resend  — regenerate invite link for a member who hasn't accepted yet
  app.post('/invite/resend', {
    preHandler: requirePermission('mem.invite'),
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const { userId } = request.body as { userId?: string }
    const { familyId, id: invitedBy, isSuperAdmin: callerIsSuperAdmin } = request.user as any

    if (!userId) {
      return reply.status(400).send({ error: 'invalid_payload', message: 'userId is required' })
    }

    // Verify the member exists (sys_admin can access any user)
    let member: any
    if (callerIsSuperAdmin) {
      ;[member] = await db`
        select u.id, u.full_name, u.phone, u.email, u.must_change_password,
               fm.role, fm.family_id
        from users u
        left join family_members fm on fm.user_id = u.id
        where u.id = ${userId}
        limit 1
      `
    } else {
      ;[member] = await db`
        select u.id, u.full_name, u.phone, u.email, u.must_change_password,
               fm.role, fm.family_id
        from family_members fm
        join users u on u.id = fm.user_id
        where fm.user_id = ${userId} and fm.family_id = ${familyId}
      `
    }
    if (!member) {
      return reply.status(404).send({ error: 'member_not_found' })
    }
    if (!member.mustChangePassword) {
      return reply.status(400).send({ error: 'already_accepted', message: 'This member has already set their password' })
    }

    // Use the member's actual familyId (from their membership row)
    const effectiveFamilyId = member.familyId || familyId

    // Expire any previous pending invitations for this user
    await db`
      update invitations set status = 'expired'
      where email = ${member.email} and status = 'pending'
      ${effectiveFamilyId ? db`and family_id = ${effectiveFamilyId}` : db``}
    `

    // Generate new OTP and invitation
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const otpHash = await bcrypt.hash(otp, 10)

    const [invitation] = await db`
      insert into invitations
        (family_id, phone, email, full_name, role, otp_hash, invited_by, expires_at)
      values (
        ${effectiveFamilyId}, ${member.phone}, ${member.email}, ${member.fullName}, ${member.role || 'member'},
        ${otpHash}, ${invitedBy},
        now() + interval '7 days'
      )
      returning id
    `

    const inviteToken = app.jwt.sign(
      {
        inviteId:           invitation.id,
        phone:              member.phone,
        familyId:           effectiveFamilyId,
        role:               member.role || 'member',
        mustChangePassword: true,
      },
      { expiresIn: '7d' }
    )

    const baseUrl = env.APP_URL || `http://${request.hostname}`
    const inviteUrl = `${baseUrl}/auth/accept-invite?token=${encodeURIComponent(inviteToken)}`

    return reply.status(201).send({
      message: 'Invitation resent',
      inviteToken,
      inviteUrl,
      phone: member.phone,
      fullName: member.fullName,
    })
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

    // Verify target user exists (sys_admin can edit any user; regular admin scoped to family)
    const { isSuperAdmin: callerIsSuperAdmin } = request.user as any
    if (callerIsSuperAdmin) {
      const [userExists] = await db`select id from users where id = ${userId}`
      if (!userExists) {
        return reply.status(404).send({ error: 'member_not_found', message: 'User not found' })
      }
    } else {
      const [member] = await db`
        select fm.user_id from family_members fm
        where fm.user_id = ${userId} and fm.family_id = ${familyId} and fm.status = 'active'
      `
      if (!member) {
        return reply.status(404).send({ error: 'member_not_found', message: 'User is not an active member of your family' })
      }
    }

    const hash = await bcrypt.hash(password, 12)
    await db`
      update users set password_hash = ${hash}, must_change_password = false
      where id = ${userId}
    `

    return { message: 'Password updated successfully' }
  })

  // GET /auth/profile  — return current user's own info
  app.get('/profile', async (request, reply) => {
    const { id: userId } = request.user as any
    if (!userId) return reply.status(401).send({ error: 'unauthorized' })

    const [user] = await db`
      select id, full_name, phone, email from users where id = ${userId}
    `
    if (!user) return reply.status(404).send({ error: 'user_not_found' })
    return user
  })

  // PATCH /auth/profile  — any authenticated user updates their own info
  app.patch('/profile', async (request, reply) => {
    const { id: userId } = request.user as any
    if (!userId) return reply.status(401).send({ error: 'unauthorized' })

    const { fullName, phone, email } = request.body as { fullName?: string; phone?: string; email?: string }

    if (!fullName && !phone && !email) {
      return reply.status(400).send({ error: 'no_fields_to_update', message: 'Provide at least one field to update' })
    }

    const updates: Record<string, string> = {}

    if (fullName) {
      const v = fullName.trim()
      if (v.length < 2 || v.length > 80) return reply.status(400).send({ error: 'invalid_full_name', message: 'Name must be 2-80 characters' })
      updates.full_name = v
    }

    if (phone) {
      const v = phone.trim()
      if (!/^\+?[1-9]\d{7,14}$/.test(v)) return reply.status(400).send({ error: 'invalid_phone', message: 'Invalid phone number format' })
      updates.phone = v
    }

    if (email) {
      const v = email.trim().toLowerCase()
      if (!/^\S+@\S+\.\S+$/.test(v)) return reply.status(400).send({ error: 'invalid_email', message: 'Invalid email format' })
      updates.email = v
    }

    if (Object.keys(updates).length === 0) {
      return reply.status(200).send({ message: 'No changes' })
    }

    try {
      const [updated] = await db`
        update users set ${db(updates)}
        where id = ${userId}
        returning id, full_name, phone, email
      `
      return reply.status(200).send(updated)
    } catch (err: any) {
      if (err?.code === '23505') {
        return reply.status(409).send({ error: 'email_or_phone_already_exists', message: 'Email or phone already in use' })
      }
      throw err
    }
  })

  // PUT /auth/change-password  — authenticated user changes their own password
  app.put('/change-password', async (request, reply) => {
    const { id: userId } = request.user as any
    if (!userId) return reply.status(401).send({ error: 'unauthorized' })

    const { currentPassword, newPassword } = request.body as { currentPassword?: string; newPassword?: string }

    if (!currentPassword || !newPassword) {
      return reply.status(400).send({ error: 'invalid_payload', message: 'currentPassword and newPassword are required' })
    }
    if (newPassword.length < 8) {
      return reply.status(400).send({ error: 'invalid_payload', message: 'New password must be at least 8 characters' })
    }

    const [user] = await db`select password_hash from users where id = ${userId}`
    if (!user) return reply.status(404).send({ error: 'user_not_found' })

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      return reply.status(400).send({ error: 'wrong_password', message: 'Current password is incorrect' })
    }

    const hash = await bcrypt.hash(newPassword, 12)
    await db`update users set password_hash = ${hash} where id = ${userId}`

    return { message: 'Password changed successfully' }
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
      returning id, full_name
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

    const [spFamily] = await db`select slug from families where id = ${claim.familyId}`
    const token = app.jwt.sign(
      { id: user.id, familyId: claim.familyId, familySlug: spFamily?.slug, fullName: user.fullName, role: claim.role, isSuperAdmin: false, mustChangePassword: false },
      { expiresIn: '7d' }
    )
    return { token }
  })
}
