import * as fs from 'fs'
import * as childProcess from 'child_process'
import Fastify from 'fastify'
import fjwt from '@fastify/jwt'
import fcors from '@fastify/cors'
import fmultipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import helmet from '@fastify/helmet'
import * as Sentry from '@sentry/node'

import { authRoutes }       from './routes/auth'
import { listsRoutes }      from './routes/lists'
import { expensesRoutes }   from './routes/expenses'
import { membersRoutes }    from './routes/members'
import { mediaRoutes }      from './routes/media'
import { permissionsRoutes } from './routes/permissions'
import { webRoutes }         from './routes/web'
import { shareRoutes }       from './routes/share'
import { adminRoutes }       from './routes/admin'
import { env }              from '../config/env'
import { redis }            from './db/redis'
import { ensureDefaultAdmin } from './services/bootstrapAdmin'
import { runMigrations }      from './services/migrate'

// ─── Sentry ────────────────────────────────────────────────────
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.2,
  })
}

const app = Fastify({ logger: { level: env.LOG_LEVEL } })

async function start() {
  // ─── Plugins ────────────────────────────────────────────────────
  await app.register(fcors,       { origin: env.CORS_ORIGIN })
  await app.register(fmultipart,  { limits: { fileSize: 10 * 1024 * 1024 } }) // 10 MB
  await app.register(fjwt,        { secret: env.JWT_SECRET })
  await app.register(helmet,      { contentSecurityPolicy: false })
  await app.register(rateLimit,   { global: true, max: 100, timeWindow: '1 minute', redis })

  // ─── Global error handler ───────────────────────────────────────
  app.setErrorHandler((error, request, reply) => {
    if (error.name === 'ZodError') {
      return reply.status(400).send({ error: 'validation_error', issues: (error as any).issues })
    }
    const statusCode = error.statusCode || 500
    if (statusCode >= 500) {
      request.log.error(error)
      if (env.SENTRY_DSN) Sentry.captureException(error)
      return reply.status(500).send({ error: 'internal_error' })
    }
    return reply.status(statusCode).send({ error: error.message })
  })

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
  await app.register(adminRoutes,       { prefix: '/admin' })
  await app.register(webRoutes)

  // Run pending migrations, then ensure default admin exists.
  await runMigrations()
  await ensureDefaultAdmin()

  // ─── Health & root ──────────────────────────────────────────────
  app.get('/', async (_req, reply) => reply.redirect('/app'))

  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

  // ─── IP-based geolocation fallback ─────────────────────────────
  // Used when browser Geolocation API is unavailable (non-HTTPS)
  app.get('/geolocate', async (request, reply) => {
    const forwarded = request.headers['x-forwarded-for']
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : request.ip
    try {
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,lat,lon,city,country`)
      const data = await res.json() as any
      if (data.status === 'success') {
        return { lat: data.lat, lng: data.lon, city: data.city, country: data.country }
      }
      // ip-api fails for private/local IPs — return a sensible default or error
      return reply.status(422).send({ error: 'geolocate_failed', message: 'Could not determine location from IP' })
    } catch (err: any) {
      return reply.status(502).send({ error: 'geolocate_error', message: err.message })
    }
  })

  // ─── Start HTTP ─────────────────────────────────────────────────
  await app.listen({ port: env.PORT, host: '0.0.0.0' })

  // ─── Start HTTPS (for geolocation support) ─────────────────────
  try {
    const certDir = '/tmp/certs'
    const keyPath = `${certDir}/key.pem`
    const certPath = `${certDir}/cert.pem`
    if (!fs.existsSync(certPath)) {
      fs.mkdirSync(certDir, { recursive: true })
      childProcess.execSync(
        `openssl req -x509 -newkey rsa:2048 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/CN=familycart"`,
        { stdio: 'pipe' }
      )
      console.info('[https] Self-signed certificate generated')
    }
    const httpsApp = Fastify({
      logger: { level: env.LOG_LEVEL },
      https: { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) },
    })
    // Redirect all HTTPS requests to the HTTP app
    httpsApp.all('/*', async (request, reply) => {
      const url = `http://127.0.0.1:${env.PORT}${request.url}`
      const headers: Record<string, string> = { 'x-forwarded-proto': 'https' }
      for (const [k, v] of Object.entries(request.headers)) {
        if (typeof v === 'string') headers[k] = v
      }
      const res = await fetch(url, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : JSON.stringify(request.body),
      })
      reply.status(res.status)
      for (const [k, v] of res.headers.entries()) {
        if (!['transfer-encoding', 'content-encoding', 'connection'].includes(k.toLowerCase())) {
          reply.header(k, v)
        }
      }
      const body = await res.text()
      return reply.send(body)
    })
    const httpsPort = Number(env.PORT) + 443 // 3443
    await httpsApp.listen({ port: httpsPort, host: '0.0.0.0' })
    console.info(`[https] HTTPS proxy listening on port ${httpsPort} (accept the self-signed cert warning in your browser)`)
  } catch (err) {
    console.warn('[https] Could not start HTTPS proxy (geolocation will use manual input):', (err as Error).message)
  }
}

start().catch(err => {
  console.error(err)
  process.exit(1)
})
