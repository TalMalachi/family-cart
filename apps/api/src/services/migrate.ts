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

    console.info('[migrate] All migrations applied')
  } catch (err) {
    console.error('[migrate] Migration error:', err)
    throw err
  }
}