-- ═══════════════════════════════════════════════════════════════
-- FamilyCart — Permission seed
-- Run after schema.sql: psql $DATABASE_URL -f seed_permissions.sql
-- ═══════════════════════════════════════════════════════════════

-- Insert all permission definitions
insert into permissions (key, api, action, description) values
  ('lists.read',   'lists',    'read',   'View all family shopping lists'),
  ('lists.write',  'lists',    'write',  'Add, edit, remove items'),
  ('lists.create', 'lists',    'create', 'Start a new shopping list'),
  ('lists.delete', 'lists',    'delete', 'Permanently remove a list'),
  ('exp.read',     'expenses', 'read',   'View family expense history'),
  ('exp.write',    'expenses', 'write',  'Log new purchases'),
  ('exp.export',   'expenses', 'export', 'Download CSV / reports'),
  ('exp.delete',   'expenses', 'delete', 'Remove expense records'),
  ('mem.invite',   'members',  'invite', 'Send SMS invitations'),
  ('mem.remove',   'members',  'remove', 'Revoke family access'),
  ('mem.perms',    'members',  'perms',  'Edit per-user permission overrides'),
  ('med.view',     'media',    'view',   'View product photos'),
  ('med.upload',   'media',    'upload', 'Attach photos to products'),
  ('med.delete',   'media',    'delete', 'Remove product photos')
on conflict (key) do nothing;

-- Admin gets all permissions
insert into role_permissions (role, permission_key)
select 'admin', key from permissions
on conflict do nothing;

-- Member gets the safe subset
insert into role_permissions (role, permission_key) values
  ('member', 'lists.read'),
  ('member', 'lists.write'),
  ('member', 'exp.read'),
  ('member', 'exp.write'),
  ('member', 'med.view'),
  ('member', 'med.upload')
on conflict do nothing;
