# FamilyCart

Family shopping lists, expenses, and product management.
React Native + Expo (iOS & Android) · Fastify API · PostgreSQL · Redis · Cloudflare R2

---

## How to restore this project from the bundle

```bash
# Clone from the bundle file
git clone familycart.bundle familycart
cd familycart

# Install dependencies
yarn install

# Copy and fill in environment variables
cp .env.example .env
# → edit .env with your DATABASE_URL, JWT_SECRET, Twilio, R2 credentials

# Set up the database
psql postgresql://postgres:password@localhost:5434/familycart -f scripts/schema.sql
psql postgresql://postgres:password@localhost:5434/familycart -f scripts/seed_permissions.sql

# Start API (port 3000)
yarn api

# Start mobile app (Expo)
yarn mobile
# → scan QR with Expo Go, or press i/a for simulator
```

## How to push to GitHub (first time)

```bash
# 1. Create a new repo on github.com (do NOT initialise with README)

# 2. Add the remote
git remote add origin https://github.com/YOUR_USERNAME/familycart.git

# 3. Push
git push -u origin main
```

---

## Project structure

```
familycart/
├── apps/
│   ├── mobile/                   React Native + Expo app
│   │   └── src/
│   │       ├── screens/
│   │       │   ├── auth/         Login, Register, VerifySMS, SetPassword
│   │       │   ├── lists/        ShoppingLists, ListDetail, ProductDetail
│   │       │   ├── expenses/     ExpensesScreen
│   │       │   └── members/      MembersScreen, PermissionsManager
│   │       ├── components/
│   │       │   ├── common/       PermissionGate, ImageGallery
│   │       │   └── lists/        AlternativesManager
│   │       ├── hooks/            useImageUpload
│   │       ├── store/            auth.ts (Zustand + SecureStore)
│   │       ├── services/         api.ts (Axios + interceptors)
│   │       ├── navigation/       RootLayout, TabsLayout
│   │       └── utils/            theme.ts (design tokens)
│   └── api/                      Fastify backend
│       └── src/
│           ├── routes/           auth, lists, expenses, members, permissions, media
│           ├── middleware/        permissions.ts (requirePermission guard)
│           ├── db/               postgres.ts, redis.ts
│           └── services/         sms.ts (Twilio)
├── packages/
│   └── shared/
│       └── src/
│           ├── types/            All TypeScript interfaces
│           ├── schemas/          Zod validation schemas
│           └── permissions/      Permission resolver + ROLE_PERMISSIONS
├── scripts/
│   ├── schema.sql                PostgreSQL schema + RLS policies
│   └── seed_permissions.sql      14 permissions + role defaults
├── .env.example                  All required environment variables
├── .github/workflows/ci.yml      GitHub Actions → Railway + EAS
└── README.md
```

---

## Roles & permissions

| Permission      | Admin | Member | Description                        |
|----------------|-------|--------|------------------------------------|
| lists.read     | ✓     | ✓      | View family shopping lists         |
| lists.write    | ✓     | ✓      | Add, edit, mark items purchased    |
| lists.create   | ✓     | —      | Create new lists                   |
| lists.delete   | ✓     | —      | Delete lists                       |
| exp.read       | ✓     | ✓      | View expense history               |
| exp.write      | ✓     | ✓      | Log new expenses                   |
| exp.export     | ✓     | —      | Download CSV                       |
| exp.delete     | ✓     | —      | Delete expense records             |
| mem.invite     | ✓     | —      | Send SMS invitations               |
| mem.remove     | ✓     | —      | Remove members                     |
| mem.perms      | ✓     | —      | Edit per-user permission overrides |
| med.view       | ✓     | ✓      | View product photos                |
| med.upload     | ✓     | ✓      | Attach photos to products          |
| med.delete     | ✓     | —      | Delete product photos              |

Admins can grant or revoke any individual permission for any member
via `PUT /permissions/member/:memberId`.

---

## API reference

| Method | Path                                    | Permission  |
|--------|-----------------------------------------|-------------|
| POST   | /auth/login                             | —           |
| POST   | /auth/register                          | —           |
| POST   | /auth/invite                            | mem.invite  |
| POST   | /auth/verify-sms                        | —           |
| POST   | /auth/set-password                      | —           |
| GET    | /lists                                  | lists.read  |
| GET    | /lists/:id                              | lists.read  |
| POST   | /lists                                  | lists.create|
| DELETE | /lists/:id                              | lists.delete|
| GET    | /lists/items/:itemId                    | lists.read  |
| POST   | /lists/:id/items                        | lists.write |
| PATCH  | /lists/items/:itemId                    | lists.write |
| DELETE | /lists/items/:itemId                    | lists.write |
| POST   | /lists/items/:itemId/alternatives       | lists.write |
| DELETE | /lists/items/:itemId/alternatives/:id   | lists.write |
| GET    | /expenses                               | exp.read    |
| GET    | /expenses/summary                       | exp.read    |
| GET    | /expenses/export                        | exp.export  |
| POST   | /expenses                               | exp.write   |
| DELETE | /expenses/:id                           | exp.delete  |
| GET    | /members                                | lists.read  |
| DELETE | /members/:id                            | mem.remove  |
| PATCH  | /members/:id/role                       | mem.perms   |
| GET    | /permissions/member/:id                 | mem.perms   |
| PUT    | /permissions/member/:id                 | mem.perms   |
| DELETE | /permissions/member/:id/reset           | mem.perms   |
| POST   | /media/presign                          | med.upload  |
| PATCH  | /media/:id/primary                      | med.upload  |
| DELETE | /media/:id                              | med.delete  |

---

## What's next

- [ ] React Query hooks layer (useList, useExpenses, useMembers)
- [ ] Supabase Realtime — live list sync across family members
- [ ] Unit tests — permission resolver + API integration tests
- [ ] Deployment — Railway (API) + EAS build (App Store / Play Store)
