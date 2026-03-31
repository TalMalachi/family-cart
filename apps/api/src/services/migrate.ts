import { db } from '../db/postgres'

/**
 * Auto-apply pending schema migrations at startup.
 * Each migration is idempotent (IF NOT EXISTS / IF NOT column checks).
 */
export async function runMigrations(): Promise<void> {
  try {
    // ─── Multi-family support migration ─────────────────────────────
    // Add is_super_admin to users
    const [hasSuperAdmin] = await db`
      select 1 from information_schema.columns
      where table_name = 'users' and column_name = 'is_super_admin'
    `
    if (!hasSuperAdmin) {
      console.info('[migrate] Adding users.is_super_admin column')
      await db.unsafe('ALTER TABLE users ADD COLUMN is_super_admin boolean NOT NULL DEFAULT false')
    }

    // Add slug to families
    const [hasSlug] = await db`
      select 1 from information_schema.columns
      where table_name = 'families' and column_name = 'slug'
    `
    if (!hasSlug) {
      console.info('[migrate] Adding families.slug column')
      await db.unsafe('ALTER TABLE families ADD COLUMN slug text')

      // Back-fill slugs from existing names
      await db.unsafe(`
        UPDATE families SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
        WHERE slug IS NULL
      `)

      // Handle duplicate slugs
      const dupes = await db`
        SELECT id, slug, row_number() OVER (PARTITION BY slug ORDER BY created_at) as rn
        FROM families
        WHERE slug IN (SELECT slug FROM families GROUP BY slug HAVING count(*) > 1)
      `
      for (const d of dupes) {
        if (d.rn > 1) {
          await db`UPDATE families SET slug = ${d.slug + '-' + d.rn} WHERE id = ${d.id}`
        }
      }

      await db.unsafe('ALTER TABLE families ALTER COLUMN slug SET NOT NULL')
      await db.unsafe('CREATE UNIQUE INDEX IF NOT EXISTS families_slug_idx ON families (slug)')
    }

    // Promote the first admin to sys_admin (is_super_admin)
    const [anySuperAdmin] = await db`SELECT 1 FROM users WHERE is_super_admin = true`
    if (!anySuperAdmin) {
      console.info('[migrate] Promoting first admin to sys_admin (is_super_admin)')
      await db`
        UPDATE users SET is_super_admin = true
        WHERE id = (
          SELECT u.id FROM users u
          JOIN family_members fm ON fm.user_id = u.id
          WHERE fm.role = 'admin' AND fm.status = 'active'
          ORDER BY u.created_at ASC
          LIMIT 1
        )
      `
    }

    // Create is_super_admin() RLS function if missing
    await db.unsafe(`
      CREATE OR REPLACE FUNCTION is_super_admin()
      RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
        SELECT exists (
          SELECT 1 FROM users
          WHERE id = (current_setting('app.current_user_id', true))::uuid
            AND is_super_admin = true
        )
      $$
    `)

    // Add super-admin RLS bypass policies (idempotent via IF NOT EXISTS pattern)
    const policies = [
      { table: 'families',                  name: 'super_admin_families' },
      { table: 'family_members',            name: 'super_admin_members' },
      { table: 'shopping_lists',            name: 'super_admin_lists' },
      { table: 'shopping_items',            name: 'super_admin_items' },
      { table: 'product_images',            name: 'super_admin_images' },
      { table: 'alternative_products',      name: 'super_admin_alts' },
      { table: 'expenses',                  name: 'super_admin_expenses' },
      { table: 'user_permission_overrides', name: 'super_admin_overrides' },
      { table: 'invitations',               name: 'super_admin_invitations' },
    ]
    for (const p of policies) {
      const [exists] = await db`
        SELECT 1 FROM pg_policies WHERE policyname = ${p.name}
      `
      if (!exists) {
        await db.unsafe(`CREATE POLICY "${p.name}" ON ${p.table} FOR ALL USING (is_super_admin())`)
      }
    }

    // ─── Malachi family migration ──────────────────────────────────
    // Create "Malachi" family if it doesn't exist, move all non-sys_admin
    // users to it, and remove sys_admin users from family_members.
    const [malachiDone] = await db`
      SELECT 1 FROM families WHERE slug = 'malachi'
    `
    if (!malachiDone) {
      console.info('[migrate] Creating Malachi family and reorganizing memberships')

      // 1. Create Malachi family
      const [malachi] = await db`
        INSERT INTO families (name, slug) VALUES ('Malachi', 'malachi') RETURNING id
      `

      // 2. Move all non-sys_admin active members to Malachi family
      //    (users who are NOT is_super_admin)
      const nonSuperUsers = await db`
        SELECT DISTINCT fm.user_id, fm.role
        FROM family_members fm
        JOIN users u ON u.id = fm.user_id
        WHERE u.is_super_admin = false
      `
      for (const u of nonSuperUsers) {
        // Upsert into Malachi family
        await db`
          INSERT INTO family_members (user_id, family_id, role, status)
          VALUES (${u.userId}, ${malachi.id}, ${u.role}, 'active')
          ON CONFLICT (user_id, family_id) DO UPDATE SET role = ${u.role}, status = 'active'
        `
      }

      // 3. Remove all memberships for non-sys_admin users from other families
      if (nonSuperUsers.length > 0) {
        const userIds = nonSuperUsers.map((u: any) => u.userId)
        await db`
          DELETE FROM family_members
          WHERE user_id = ANY(${userIds})
            AND family_id != ${malachi.id}
        `
      }

      // 4. Remove sys_admin users from ALL family_members
      await db`
        DELETE FROM family_members
        WHERE user_id IN (SELECT id FROM users WHERE is_super_admin = true)
      `

      // 5. Move ALL shopping lists and expenses to Malachi
      await db`
        UPDATE shopping_lists SET family_id = ${malachi.id}
        WHERE family_id != ${malachi.id}
      `
      await db`
        UPDATE expenses SET family_id = ${malachi.id}
        WHERE family_id != ${malachi.id}
      `

      console.info('[migrate] Malachi family created, memberships reorganized')
    }

    console.info('[migrate] All migrations applied')
  } catch (err) {
    console.error('[migrate] Migration error:', err)
    throw err
  }
}