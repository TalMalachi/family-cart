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
import { env }              from './config/env'

const app = Fastify({ logger: { level: env.LOG_LEVEL } })

// ─── Plugins ──────────────────────────────────────────────────────
await app.register(fcors,       { origin: env.CORS_ORIGIN })
await app.register(fmultipart,  { limits: { fileSize: 10 * 1024 * 1024 } }) // 10 MB
await app.register(fjwt,        { secret: env.JWT_SECRET })

// ─── Auth decorator ───────────────────────────────────────────────
app.addHook('preHandler', async (request, reply) => {
  try {
    await request.jwtVerify()
  } catch {
    // Routes that need auth use requirePermission() which will 401
  }
})

// ─── Routes ───────────────────────────────────────────────────────
await app.register(authRoutes,        { prefix: '/auth' })
await app.register(listsRoutes,       { prefix: '/lists' })
await app.register(expensesRoutes,    { prefix: '/expenses' })
await app.register(membersRoutes,     { prefix: '/members' })
await app.register(mediaRoutes,       { prefix: '/media' })
await app.register(permissionsRoutes, { prefix: '/permissions' })

// ─── Health ───────────────────────────────────────────────────────
app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

// ─── Start ────────────────────────────────────────────────────────
try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
