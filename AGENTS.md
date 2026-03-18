# AGENTS.md — FamilyCart

## Architecture

Yarn workspaces monorepo with three packages:

- **`apps/api`** — Fastify 4 backend (TypeScript, `tsx watch`). Routes in `src/routes/`, each registered with a URL prefix in `src/index.ts`.
- **`apps/mobile`** — React Native + Expo 52 app using `expo-router`. State via Zustand (`src/store/auth.ts`), HTTP via Axios (`src/services/api.ts`), styling via design tokens (`src/utils/theme.ts`).
- **`packages/shared`** — Shared types (`src/types/`), Zod schemas (`src/schemas/`), and permission logic (`src/permissions/`). Imported by both apps as `@familycart/shared` and `@familycart/shared/schemas`, `@familycart/shared/permissions`.

Data: PostgreSQL 16 (via `postgres` driver with `transform: postgres.camel` — **DB columns are snake_case, JS objects are camelCase**). Redis (ioredis) for permission caching (5 min TTL, key pattern `perms:{userId}:{familyId}`). Media storage on Cloudflare R2 via S3-compatible SDK.

## Key Patterns

### Permission system
14 permission keys (e.g. `lists.read`, `exp.write`, `med.upload`) defined in `packages/shared/src/permissions/index.ts`. Role defaults in `ROLE_PERMISSIONS` (admin = all, member = safe subset). Per-user overrides stored in `user_permission_overrides` table. Resolver: `resolvePermissions(role, overrides)` — used server-side (cached in Redis) AND client-side (in Zustand store).

**API route guard:** `{ preHandler: requirePermission('lists.create') }` — see `apps/api/src/middleware/permissions.ts`.  
**Mobile UI guard:** `<PermissionGate require="lists.create">` component or `usePermission('lists.delete')` hook — see `apps/mobile/src/components/common/PermissionGate.tsx`.  
**Cache invalidation:** call `invalidatePermissionCache(userId, familyId)` after any override change.

### Row-Level Security (RLS)
PostgreSQL RLS policies enforce family isolation. The API sets `app.current_user_id` via `set_config` before queries (done inside `requirePermission` / `requireAuth`). See `scripts/schema.sql` for all policies. Helper functions: `is_family_member(fam_id)`, `is_family_admin(fam_id)`.

### Validation
All input validation uses Zod schemas from `packages/shared/src/schemas/index.ts`. Routes parse with `.safeParse()` and return `400` on failure. When adding a new endpoint, add its schema to the shared package first.

### API error responses
Consistent shape: `{ error: string, message: string, required?: PermissionKey }`. Status codes: `400` invalid input, `401` not authenticated, `403` forbidden (includes `required` field), `404` not found.

### Auth flow
Register → SMS OTP (Twilio, console.log in dev) → verify → set password → login (JWT). Bootstrap admin auto-created on first start via `ensureDefaultAdmin()`. JWT payload includes `id`, `familyId`, `role`, `fullName`.

## Commands

```bash
yarn install                   # install all workspaces
yarn api                       # start API with hot-reload (tsx watch, port 3000)
yarn mobile                    # start Expo dev server
yarn typecheck                 # typecheck all workspaces

# Docker (full stack: postgres:5434, redis:6379, api:3000, adminer:8999)
./docker/main.sh dev           # dev mode with hot-reload
./docker/main.sh up            # production-like
./docker/main.sh db            # open psql shell
./docker/main.sh stop --clean  # stop + wipe volumes

# Database
psql $DATABASE_URL -f scripts/schema.sql           # apply schema
psql $DATABASE_URL -f scripts/seed_permissions.sql  # seed 14 permissions
```

## Adding a New API Route

1. Add Zod schema to `packages/shared/src/schemas/index.ts`
2. Add types to `packages/shared/src/types/index.ts` if needed
3. Create route file in `apps/api/src/routes/` following existing pattern (Fastify plugin function)
4. Register in `apps/api/src/index.ts` with `app.register(route, { prefix: '/path' })`
5. Guard with `requirePermission('key')` — add new permission keys to `packages/shared/src/permissions/index.ts` and `scripts/seed_permissions.sql`
6. Ownership checks: always verify entity belongs to `request.user.familyId` before mutations

## External Services

- **Twilio** — SMS OTP. In `NODE_ENV=development`, messages are logged to console instead of sent.
- **Cloudflare R2** — media uploads via S3 presigned URLs. Leave env vars blank to skip in dev.
- **OpenAI** — optional AI image search (`src/services/aiImageSearch.ts`). Disabled when `OPENAI_API_KEY` is empty.

## Environment

Config validated with Zod in `apps/api/config/env.ts`. Required: `DATABASE_URL`, `JWT_SECRET` (min 32 chars). Defaults exist for most other values. See `docker-compose.yml` for all env vars with dev defaults.

