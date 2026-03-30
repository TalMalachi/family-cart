-- ═══════════════════════════════════════════════════════════════
-- Migration: Multi-family support
-- Adds families.slug (unique), users.is_super_admin, super-admin RLS
-- ═══════════════════════════════════════════════════════════════

-- 1. Add is_super_admin column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;

-- 2. Add slug column to families
ALTER TABLE families ADD COLUMN IF NOT EXISTS slug text;

-- Back-fill slugs from existing names (lowercase, hyphens for spaces, strip special chars)
UPDATE families SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Handle duplicate slugs by appending a suffix
DO $$
DECLARE
  rec RECORD;
  counter int;
BEGIN
  FOR rec IN
    SELECT id, slug FROM families
    WHERE slug IN (SELECT slug FROM families GROUP BY slug HAVING count(*) > 1)
    ORDER BY created_at
  LOOP
    counter := (SELECT count(*) FROM families WHERE slug = rec.slug AND id < rec.id);
    IF counter > 0 THEN
      UPDATE families SET slug = rec.slug || '-' || counter WHERE id = rec.id;
    END IF;
  END LOOP;
END $$;

ALTER TABLE families ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS families_slug_idx ON families (slug);

-- 3. Super-admin helper function
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT exists (
    SELECT 1 FROM users
    WHERE id = (current_setting('app.current_user_id', true))::uuid
      AND is_super_admin = true
  )
$$;

-- 4. Super-admin bypass RLS policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'super_admin_families') THEN
    CREATE POLICY "super_admin_families" ON families FOR ALL USING (is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'super_admin_members') THEN
    CREATE POLICY "super_admin_members" ON family_members FOR ALL USING (is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'super_admin_lists') THEN
    CREATE POLICY "super_admin_lists" ON shopping_lists FOR ALL USING (is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'super_admin_items') THEN
    CREATE POLICY "super_admin_items" ON shopping_items FOR ALL USING (is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'super_admin_images') THEN
    CREATE POLICY "super_admin_images" ON product_images FOR ALL USING (is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'super_admin_alts') THEN
    CREATE POLICY "super_admin_alts" ON alternative_products FOR ALL USING (is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'super_admin_expenses') THEN
    CREATE POLICY "super_admin_expenses" ON expenses FOR ALL USING (is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'super_admin_overrides') THEN
    CREATE POLICY "super_admin_overrides" ON user_permission_overrides FOR ALL USING (is_super_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'super_admin_invitations') THEN
    CREATE POLICY "super_admin_invitations" ON invitations FOR ALL USING (is_super_admin());
  END IF;
END $$;

-- 5. Promote the first admin user to super-admin
UPDATE users SET is_super_admin = true
WHERE id = (
  SELECT u.id FROM users u
  JOIN family_members fm ON fm.user_id = u.id
  WHERE fm.role = 'admin' AND fm.status = 'active'
  ORDER BY u.created_at ASC
  LIMIT 1
);