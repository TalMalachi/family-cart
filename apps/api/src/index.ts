import Fastify from 'fastify'
import fjwt from '@fastify/jwt'
import fcors from '@fastify/cors'
import fmultipart from '@fastify/multipart'

import { authRoutes }       from './routes/auth'
import { listsRoutes }      from './routes/lists'
import { expensesRoutes }   from './routes/expenses'
import { membersRoutes }    from './routes/members'
import { mediaRoutes }      from './routes/media'
import { permissionsRoutes } from './routes/permissions'
import { webRoutes }         from './routes/web'
import { shareRoutes }       from './routes/share'
import { env }              from '../config/env'
import { ensureDefaultAdmin } from './services/bootstrapAdmin'

const app = Fastify({ logger: { level: env.LOG_LEVEL } })

async function start() {
  // ─── Plugins ────────────────────────────────────────────────────
  await app.register(fcors,       { origin: env.CORS_ORIGIN })
  await app.register(fmultipart,  { limits: { fileSize: 10 * 1024 * 1024 } }) // 10 MB
  await app.register(fjwt,        { secret: env.JWT_SECRET })

  // ─── Auth decorator ─────────────────────────────────────────────
  app.addHook('preHandler', async request => {
    try {
      await request.jwtVerify()
    } catch {
      // Routes that need auth use requirePermission() which will 401
    }
  })

  // ─── Routes ─────────────────────────────────────────────────────
  await app.register(authRoutes,        { prefix: '/auth' })
  await app.register(listsRoutes,       { prefix: '/lists' })
  await app.register(expensesRoutes,    { prefix: '/expenses' })
  await app.register(membersRoutes,     { prefix: '/members' })
  await app.register(mediaRoutes,       { prefix: '/media' })
  await app.register(permissionsRoutes, { prefix: '/permissions' })
  await app.register(shareRoutes,       { prefix: '/share' })
  await app.register(webRoutes)

  // Ensure first-time access in fresh environments.
  await ensureDefaultAdmin()

  // ─── Health & root ──────────────────────────────────────────────
  app.get('/', async (_req, reply) => reply.redirect('/app'))

  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

  // ─── Start ──────────────────────────────────────────────────────
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

start().catch(err => {
  console.error(err)
  process.exit(1)
})
