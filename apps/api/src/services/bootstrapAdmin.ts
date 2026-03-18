import * as bcrypt from 'bcryptjs'
import { db } from '../db/postgres'

type UserRow = { id: string }
type FamilyRow = { id: string }

const DEFAULT_ADMIN = {
  fullName: process.env.DEFAULT_ADMIN_FULL_NAME ?? 'FamilyCart Admin',
  phone: process.env.DEFAULT_ADMIN_PHONE ?? '+10000000001',
  email: process.env.DEFAULT_ADMIN_EMAIL ?? 'admin@familycart.local',
  password: process.env.DEFAULT_ADMIN_PASSWORD ?? 'Admin123!',
  familyName: process.env.DEFAULT_ADMIN_FAMILY_NAME ?? 'FamilyCart Home',
}

// Creates one admin account for a fresh database so the first login is always possible.
export async function ensureDefaultAdmin(): Promise<void> {
  if ((process.env.SEED_DEFAULT_ADMIN ?? 'true').toLowerCase() === 'false') {
    console.info('[familycart] Default admin bootstrap disabled (SEED_DEFAULT_ADMIN=false)')
    return
  }

  // Keep default admin account privileged in existing environments.
  if (DEFAULT_ADMIN.email) {
    await db`
      update family_members fm
      set role = 'admin', status = 'active'
      from users u
      where fm.user_id = u.id
        and u.email = ${DEFAULT_ADMIN.email}
    `
  }

  const [existingAdmin] = await db<UserRow[]>`
    select u.id
    from users u
    join family_members fm on fm.user_id = u.id
    where fm.role = 'admin'
      and fm.status = 'active'
    limit 1
  `

  if (existingAdmin) {
    console.info('[familycart] Default admin bootstrap skipped (active admin already exists)')
    return
  }

  const [userByPhone] = await db<UserRow[]>`
    select id from users where phone = ${DEFAULT_ADMIN.phone} limit 1
  `

  let userId = userByPhone?.id

  if (!userId && DEFAULT_ADMIN.email) {
    const [userByEmail] = await db<UserRow[]>`
      select id from users where email = ${DEFAULT_ADMIN.email} limit 1
    `
    userId = userByEmail?.id
  }

  if (!userId) {
    const hash = await bcrypt.hash(DEFAULT_ADMIN.password, 12)
    const [createdUser] = await db<UserRow[]>`
      insert into users (full_name, phone, email, password_hash, must_change_password)
      values (
        ${DEFAULT_ADMIN.fullName},
        ${DEFAULT_ADMIN.phone},
        ${DEFAULT_ADMIN.email},
        ${hash},
        false
      )
      returning id
    `
    userId = createdUser.id
  }

  const [family] = await db<FamilyRow[]>`
    insert into families (name, created_by)
    values (${DEFAULT_ADMIN.familyName}, ${userId})
    returning id
  `

  await db`
    insert into family_members (user_id, family_id, role, status)
    values (${userId}, ${family.id}, 'admin', 'active')
    on conflict (user_id, family_id)
    do update set role = 'admin', status = 'active'
  `

  console.warn(
    '[familycart] Created default admin user for first login',
    { email: DEFAULT_ADMIN.email, phone: DEFAULT_ADMIN.phone }
  )
}
