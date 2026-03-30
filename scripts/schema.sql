-- ═══════════════════════════════════════════════════════════════
-- FamilyCart — PostgreSQL schema + RLS policies
-- Run with: psql $DATABASE_URL -f schema.sql
-- ═══════════════════════════════════════════════════════════════

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── Users ───────────────────────────────────────────────────────
create table users (
  id           uuid primary key default gen_random_uuid(),
  email        text unique,
  phone        text not null,
  full_name    text not null,
  password_hash text not null,
  must_change_password boolean default false,
  is_super_admin boolean not null default false,
  created_at   timestamptz default now()
);

-- ─── Families ────────────────────────────────────────────────────
create table families (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  slug                 text unique not null,
  whatsapp_group_link  text,
  created_by           uuid references users(id) on delete set null,
  created_at           timestamptz default now()
);

-- ─── Family Members ──────────────────────────────────────────────
create type member_role   as enum ('admin', 'member');
create type member_status as enum ('register', 'active', 'suspended', 'deleted');

create table family_members (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id) on delete cascade,
  family_id    uuid references families(id) on delete cascade,
  role         member_role not null default 'member',
  status       member_status not null default 'register',
  joined_at    timestamptz default now(),
  unique (user_id, family_id)
);

-- ─── Invitations ─────────────────────────────────────────────────
create type invite_status as enum ('pending', 'accepted', 'expired');

create table invitations (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid references families(id) on delete cascade,
  phone        text not null,
  email        text not null,
  full_name    text not null,
  role         member_role not null default 'member',
  status       invite_status not null default 'pending',
  otp_hash     text not null,            -- bcrypt hash of the 6-digit code
  invited_by   uuid references users(id),
  expires_at   timestamptz not null default (now() + interval '15 minutes'),
  created_at   timestamptz default now()
);

-- ─── Permissions ─────────────────────────────────────────────────
create table permissions (
  key          text primary key,         -- 'lists.read', 'exp.write', etc.
  api          text not null,            -- 'lists' | 'expenses' | 'members' | 'media'
  action       text not null,
  description  text
);

create table role_permissions (
  role         member_role not null,
  permission_key text references permissions(key) on delete cascade,
  primary key (role, permission_key)
);

create table user_permission_overrides (
  family_member_id uuid references family_members(id) on delete cascade,
  permission_key   text references permissions(key) on delete cascade,
  granted          boolean not null,
  granted_by       uuid references users(id),
  granted_at       timestamptz default now(),
  primary key (family_member_id, permission_key)
);

-- ─── Shopping Lists ───────────────────────────────────────────────
create type list_status as enum ('active', 'completed', 'archived');

create table shopping_lists (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid references families(id) on delete cascade,
  name         text not null,
  status       list_status not null default 'active',
  completed_at timestamptz,
  created_by   uuid references users(id),
  created_at   timestamptz default now()
);

create table shopping_items (
  id               uuid primary key default gen_random_uuid(),
  list_id          uuid references shopping_lists(id) on delete cascade,
  name             text not null,
  quantity         numeric(10,2) not null default 1,
  unit             text,
  estimated_price  numeric(10,2),
  category         text,
  is_purchased     boolean not null default false,
  purchased_by     uuid references users(id),
  purchased_at     timestamptz,
  created_by       uuid references users(id),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create table product_images (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid references shopping_items(id) on delete cascade,
  url          text not null,
  is_primary   boolean default false,
  uploaded_by  uuid references users(id),
  uploaded_at  timestamptz default now()
);

create type alt_priority as enum ('preferred', 'fallback');

create table alternative_products (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid references shopping_items(id) on delete cascade,
  name         text not null,
  note         text,
  priority     alt_priority not null default 'fallback',
  image_url    text
);

-- ─── Expenses ─────────────────────────────────────────────────────
create type expense_category as enum (
  'groceries', 'household', 'personal', 'pharmacy', 'other'
);

create table expenses (
  id               uuid primary key default gen_random_uuid(),
  family_id        uuid references families(id) on delete cascade,
  title            text not null,
  total_amount     numeric(10,2) not null,
  category         expense_category not null default 'groceries',
  paid_by          uuid references users(id),
  shopping_list_id uuid references shopping_lists(id) on delete set null,
  date             date not null,
  created_at       timestamptz default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────
create index on family_members (family_id);
create index on family_members (user_id);
create index on shopping_lists (family_id);
create index on shopping_lists (status);
create index on shopping_items (list_id);
create index on shopping_items (is_purchased);
create index on expenses (family_id);
create index on expenses (date desc);
create index on user_permission_overrides (family_member_id);

-- ─── Row Level Security ───────────────────────────────────────────
-- auth.uid() is set by the API after JWT validation via set_config

alter table families                  enable row level security;
alter table family_members            enable row level security;
alter table shopping_lists            enable row level security;
alter table shopping_items            enable row level security;
alter table product_images            enable row level security;
alter table alternative_products      enable row level security;
alter table expenses                  enable row level security;
alter table user_permission_overrides enable row level security;
alter table invitations               enable row level security;

-- Helper: is the calling user a super admin?
create or replace function is_super_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from users
    where id = (current_setting('app.current_user_id', true))::uuid
      and is_super_admin = true
  )
$$;

-- Helper: is the calling user a member of this family?
create or replace function is_family_member(fam_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from family_members
    where family_id = fam_id
      and user_id = (current_setting('app.current_user_id', true))::uuid
      and status = 'active'
  )
$$;

-- Helper: is the calling user an admin of this family?
create or replace function is_family_admin(fam_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from family_members
    where family_id = fam_id
      and user_id = (current_setting('app.current_user_id', true))::uuid
      and role = 'admin'
      and status = 'active'
  )
$$;

-- Families: members can see their own family
create policy "members_see_family" on families
  for select using (is_family_member(id));

-- Family members: everyone in the family sees the list
create policy "members_see_members" on family_members
  for select using (is_family_member(family_id));

-- Only admins can insert/update/delete members
create policy "admin_manage_members" on family_members
  for all using (is_family_admin(family_id));

-- Shopping lists: family isolation
create policy "family_list_select" on shopping_lists
  for select using (is_family_member(family_id));
create policy "family_list_insert" on shopping_lists
  for insert with check (is_family_member(family_id));
create policy "family_list_update" on shopping_lists
  for update using (is_family_member(family_id));
create policy "admin_list_delete" on shopping_lists
  for delete using (is_family_admin(family_id));

-- Shopping items: inherit list's family
create policy "family_items" on shopping_items
  for all using (
    exists (
      select 1 from shopping_lists sl
      where sl.id = list_id and is_family_member(sl.family_id)
    )
  );

-- Same pattern for images and alternatives
create policy "family_images" on product_images
  for all using (
    exists (
      select 1 from shopping_items si
      join shopping_lists sl on sl.id = si.list_id
      where si.id = item_id and is_family_member(sl.family_id)
    )
  );

create policy "family_alternatives" on alternative_products
  for all using (
    exists (
      select 1 from shopping_items si
      join shopping_lists sl on sl.id = si.list_id
      where si.id = item_id and is_family_member(sl.family_id)
    )
  );

-- Expenses: family isolation
create policy "family_expenses" on expenses
  for all using (is_family_member(family_id));

-- Permission overrides: only admins can read/write
create policy "admin_overrides" on user_permission_overrides
  for all using (
    exists (
      select 1 from family_members fm
      where fm.id = family_member_id and is_family_admin(fm.family_id)
    )
  );

-- Invitations: admin can manage, pending user can read their own
create policy "admin_invitations" on invitations
  for all using (is_family_admin(family_id));

-- ─── Super-admin bypass policies ──────────────────────────────────
create policy "super_admin_families" on families for all using (is_super_admin());
create policy "super_admin_members" on family_members for all using (is_super_admin());
create policy "super_admin_lists" on shopping_lists for all using (is_super_admin());
create policy "super_admin_items" on shopping_items for all using (is_super_admin());
create policy "super_admin_images" on product_images for all using (is_super_admin());
create policy "super_admin_alts" on alternative_products for all using (is_super_admin());
create policy "super_admin_expenses" on expenses for all using (is_super_admin());
create policy "super_admin_overrides" on user_permission_overrides for all using (is_super_admin());
create policy "super_admin_invitations" on invitations for all using (is_super_admin());
